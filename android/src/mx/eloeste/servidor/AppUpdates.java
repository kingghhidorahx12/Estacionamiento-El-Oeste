package mx.eloeste.servidor;

import android.app.*;
import android.content.*;
import android.content.pm.*;
import android.net.Uri;
import android.util.AtomicFile;
import android.os.*;
import java.io.*;
import java.net.*;
import java.security.*;
import java.util.*;
import java.util.concurrent.*;
import javax.net.ssl.HttpsURLConnection;
import org.json.*;
import mx.eloeste.core.*;
import mx.eloeste.core.Security;

/** Downloads only from the project's channel. Android always confirms installation. */
final class AppUpdates implements Api.Application {
    private static AppUpdates instance;
    static synchronized AppUpdates get(Context context){if(instance==null)instance=new AppUpdates(context.getApplicationContext());return instance;}
    private final Context context;private final ExecutorService worker=Executors.newSingleThreadExecutor();
    private String state="idle",message="Busca una actualización cuando la tablet tenga Internet.",available="";private int progress=0;private boolean busy=false;
    private final String version;private final long versionCode;
    private UpdateManifest pending;
    private AppUpdates(Context c){context=c;try{PackageInfo p=c.getPackageManager().getPackageInfo(c.getPackageName(),0);version=p.versionName;versionCode=p.getLongVersionCode();}catch(Exception e){throw new IllegalStateException(e);}restorePending();}
    private File metadata(){return new File(context.getFilesDir(),"update-ready.json");}
    private void restorePending(){
        try(InputStream in=new FileInputStream(metadata());ByteArrayOutputStream out=new ByteArrayOutputStream()){
            byte[] b=new byte[4096];int n;while((n=in.read(b))!=-1){if(out.size()+n>16384)return;out.write(b,0,n);}
            UpdateManifest value=new UpdateManifest(new JSONObject(out.toString("UTF-8")));
            if(value.code>versionCode&&file(context).length()==value.bytes){pending=value;available=value.version;state="ready";progress=100;message="Actualización descargada. Confirma su instalación en la tablet.";}
        }catch(Exception ignored){/* A missing or cleared cache requires a fresh, verified download. */}
    }
    private void savePending(UpdateManifest value)throws Exception{
        JSONObject data=new JSONObject().put("version",value.version).put("versionCode",value.code).put("url",value.url).put("sha256",value.sha256).put("bytes",value.bytes);
        AtomicFile atomic=new AtomicFile(metadata());FileOutputStream out=atomic.startWrite();try{out.write(data.toString().getBytes("UTF-8"));atomic.finishWrite(out);}catch(Exception e){atomic.failWrite(out);throw e;}
        synchronized(this){pending=value;}
    }
    public synchronized JSONObject status(){return new JSONObject().put("supported",true).put("version",version).put("versionCode",versionCode).put("state",state).put("message",message).put("available",available).put("progress",progress);}
    public synchronized JSONObject prepareUpdate(){
        if(busy)return new JSONObject().put("ok",true).put("message","La tablet ya está preparando la actualización.");
        if(state.equals("ready")&&file(context).exists()){notifyReady();return new JSONObject().put("ok",true).put("message","Lista para instalar. Confirma en la tablet.");}
        busy=true;state="checking";message="Buscando la última versión de El Oeste…";progress=0;
        worker.execute(()->download());return new JSONObject().put("ok",true).put("message","La tablet está buscando la actualización. Puedes consultar aquí su avance.");
    }
    private synchronized void stage(String next,String text,int percent){state=next;message=text;progress=percent;}
    private void download(){
        File temporary=new File(context.getCacheDir(),"oeste-update.part");
        try {
            byte[] json=readSmall(UpdateManifest.SOURCE);UpdateManifest manifest=new UpdateManifest(new JSONObject(new String(json,"UTF-8")));
            if(manifest.code<=versionCode){stage("current","Ya tienes la versión más reciente publicada: "+version+".",0);return;}
            synchronized(this){available=manifest.version;}
            stage("downloading","Descargando El Oeste "+manifest.version+"…",0);
            HttpsURLConnection connection=open(manifest.url);
            try(InputStream in=connection.getInputStream();FileOutputStream out=new FileOutputStream(temporary)){
                MessageDigest digest=MessageDigest.getInstance("SHA-256");byte[] buffer=new byte[32768];long count=0;int n;
                while((n=in.read(buffer))!=-1){count+=n;Rules.require(count<=manifest.bytes&&count<=UpdateManifest.MAX_BYTES,"Descarga de tamaño inesperado.");digest.update(buffer,0,n);out.write(buffer,0,n);stage("downloading","Descargando El Oeste "+manifest.version+"…",(int)(count*100/manifest.bytes));}
                out.getFD().sync();Rules.require(count==manifest.bytes&&Security.equal(hex(digest.digest()),manifest.sha256),"La descarga no superó la verificación. Vuelve a buscar la actualización.");
            } finally {connection.disconnect();}
            verifyPackage(temporary,manifest.code,manifest.version);File ready=file(context);
            if(!temporary.renameTo(ready))throw new IOException("No se pudo preparar el instalador.");
            savePending(manifest);
            stage("ready","Actualización verificada. Confirma la instalación en la tablet.",100);notifyReady();
        }catch(Exception e){stage("error",e instanceof IllegalArgumentException?e.getMessage():"No se pudo descargar la actualización. Comprueba Internet y vuelve a intentarlo.",0);}
        finally {if(temporary.exists())temporary.delete();synchronized(this){busy=false;}}
    }
    private void verifyPackage(File apk,long expectedCode,String expectedVersion)throws Exception {
        PackageManager manager=context.getPackageManager();PackageInfo candidate=manager.getPackageArchiveInfo(apk.getAbsolutePath(),PackageManager.GET_SIGNING_CERTIFICATES),installed=manager.getPackageInfo(context.getPackageName(),PackageManager.GET_SIGNING_CERTIFICATES);
        Rules.require(candidate!=null&&context.getPackageName().equals(candidate.packageName)&&candidate.getLongVersionCode()>installed.getLongVersionCode()&&(expectedCode<0||candidate.getLongVersionCode()==expectedCode),"El archivo no es una actualización válida de esta aplicación.");
        Rules.require(candidate.applicationInfo!=null&&candidate.applicationInfo.minSdkVersion<=Build.VERSION.SDK_INT&&expectedVersion.equals(candidate.versionName),"Esta versión no es compatible con la tablet o no coincide con la publicación.");
        Rules.require(candidate.signingInfo!=null&&installed.signingInfo!=null&&!candidate.signingInfo.hasMultipleSigners()&&!installed.signingInfo.hasMultipleSigners(),"Firma de actualización no válida.");
        android.content.pm.Signature[] a=candidate.signingInfo.getApkContentsSigners(),b=installed.signingInfo.getApkContentsSigners();
        Rules.require(a.length==1&&b.length==1&&MessageDigest.isEqual(a[0].toByteArray(),b[0].toByteArray()),"La actualización no tiene la firma de tu instalación de El Oeste.");
    }
    interface InstallReady{void ready(Intent intent,String error);}
    void installer(InstallReady result){worker.execute(()->{Intent intent=null;String error=null;try{intent=installer();}catch(Exception e){error=e.getMessage()==null?"No se pudo verificar la actualización.":e.getMessage();}final Intent value=intent;final String problem=error;new Handler(Looper.getMainLooper()).post(()->result.ready(value,problem));});}
    private Intent installer()throws Exception {
        UpdateManifest value;synchronized(this){Rules.require(state.equals("ready")&&pending!=null&&file(context).exists(),"Busca y prepara primero una actualización.");value=pending;}
        MessageDigest digest=MessageDigest.getInstance("SHA-256");try(InputStream in=new FileInputStream(file(context))){byte[] b=new byte[32768];int n;while((n=in.read(b))!=-1)digest.update(b,0,n);}
        Rules.require(file(context).length()==value.bytes&&Security.equal(hex(digest.digest()),value.sha256),"La actualización descargada cambió. Vuelve a buscarla.");
        verifyPackage(file(context),value.code,value.version);
        return new Intent(Intent.ACTION_VIEW).setDataAndType(Uri.parse("content://"+context.getPackageName()+".update/package.apk"),"application/vnd.android.package-archive").addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
    }
    private void notifyReady(){
        String ticket=Security.random();context.getSharedPreferences("private",0).edit().putString("updateTicket",ticket).putLong("updateTicketUntil",System.currentTimeMillis()+1800000L).apply();
        ServerService.channel(context);Intent open=new Intent(context,MainActivity.class).putExtra("updateTicket",ticket);
        PendingIntent action=PendingIntent.getActivity(context,77,open,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
        Notification notice=new Notification.Builder(context,ServerService.CHANNEL).setSmallIcon(android.R.drawable.stat_sys_download_done).setContentTitle("El Oeste "+available+" listo para instalar").setContentText("Toca para confirmar la actualización en esta tablet.").setContentIntent(action).setAutoCancel(true).build();
        try{context.getSystemService(NotificationManager.class).notify(77,notice);}catch(SecurityException ignored){/* Opening the tablet app also finds the pending administrator request. */}
    }
    synchronized boolean authorizePending(String supplied){
        SharedPreferences prefs=context.getSharedPreferences("private",0);String ticket=prefs.getString("updateTicket","");
        boolean valid=state.equals("ready")&&file(context).exists()&&ticket.length()==64&&prefs.getLong("updateTicketUntil",0)>System.currentTimeMillis()&&(supplied==null||Security.equal(ticket,supplied));
        return valid;
    }
    static File file(Context c){return new File(c.getCacheDir(),"oeste-update.apk");}
    private byte[] readSmall(String url)throws Exception{
        HttpsURLConnection connection=open(url);try(InputStream in=connection.getInputStream();ByteArrayOutputStream out=new ByteArrayOutputStream()){byte[] b=new byte[4096];int n;while((n=in.read(b))!=-1){Rules.require(out.size()+n<=16384,"Información de actualización inválida.");out.write(b,0,n);}return out.toByteArray();}finally{connection.disconnect();}
    }
    private HttpsURLConnection open(String address)throws Exception {
        for(int i=0;i<6;i++){
            Rules.require(UpdateManifest.downloadHost(address),"Origen de actualización no permitido.");HttpsURLConnection c=(HttpsURLConnection)new URL(address).openConnection();c.setInstanceFollowRedirects(false);c.setConnectTimeout(15000);c.setReadTimeout(30000);c.setRequestProperty("User-Agent","El-Oeste/"+version);c.setRequestProperty("Accept","application/octet-stream");int code=c.getResponseCode();
            if(code>=300&&code<=399){String location=c.getHeaderField("Location");c.disconnect();Rules.require(location!=null,"Redirección inválida.");address=new URL(new URL(address),location).toString();continue;}
            if(code!=200){c.disconnect();throw new IOException("Update HTTP "+code);}return c;
        }throw new IOException("Demasiadas redirecciones");
    }
    private static String hex(byte[] bytes){StringBuilder s=new StringBuilder();for(byte b:bytes)s.append(String.format(Locale.ROOT,"%02x",b&255));return s.toString();}
}
