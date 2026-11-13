package mx.eloeste.servidor;

import android.app.*;
import android.content.*;
import android.os.*;
import java.io.*;
import java.util.concurrent.*;
import mx.eloeste.core.*;

public final class ServerService extends Service {
    private LocalServer server; private AndroidDb database; private ScheduledExecutorService sync;
    private volatile boolean destroyed=false; private String addresses="";
    private final Object listenerLock=new Object(); private ScheduledFuture<?> task;
    public static volatile String status="Detenido";
    public static final String CHANNEL="oeste-local";
    public static void channel(Context c) { NotificationManager nm=c.getSystemService(NotificationManager.class); nm.createNotificationChannel(new NotificationChannel(CHANNEL,"Servidor local",NotificationManager.IMPORTANCE_LOW)); }
    static Notification notice(Context c,String text) { channel(c); return new Notification.Builder(c,CHANNEL).setContentTitle("Estacionamiento El Oeste").setContentText(text).setSmallIcon(android.R.drawable.ic_menu_mylocation).setOngoing(true).setContentIntent(PendingIntent.getActivity(c,0,new Intent(c,MainActivity.class),PendingIntent.FLAG_IMMUTABLE)).build(); }
    @Override public int onStartCommand(Intent intent,int flags,int startId) {
        startForeground(1,notice(this,"Preparando conexión segura del estacionamiento"));
        if(sync!=null) { if(status.startsWith("No se pudo")) {status="Preparando conexión segura…";sync.execute(()->tick());} return START_STICKY; }
        status="Preparando conexión segura…"; sync=Executors.newSingleThreadScheduledExecutor();
        task=sync.scheduleWithFixedDelay(()->tick(),0,60,TimeUnit.SECONDS);
        return START_STICKY;
    }
    private void tick() {
            try {
                if(destroyed) return;
                if(database==null) database=new AndroidDb(this);
                Api api=new Api(database); if(api.needsSetup()) throw new IllegalStateException("Crea primero el administrador.");
                String current=String.join(",",LocalCertificates.wifi(this));
                if(server==null||!current.equals(addresses)||LocalCertificates.expiring(this)) {
                    javax.net.ssl.SSLContext tls=LocalCertificates.ensure(this);
                    synchronized(listenerLock) {
                        if(destroyed) return;
                        if(server!=null) server.close(); server=null;
                        server=new LocalServer(api,name->{ try(InputStream asset=getAssets().open(name); ByteArrayOutputStream out=new ByteArrayOutputStream()) { byte[] b=new byte[8192]; int n; while((n=asset.read(b))!=-1) out.write(b,0,n); return out.toByteArray(); } },8443,tls);
                        server.start(); addresses=current;
                    }
                }
                if(destroyed)return;
                status="Activo · Conexión segura";
                getSystemService(NotificationManager.class).notify(1,notice(this,"Servidor local activo · mantén la tablet encendida"));
                new RemoteSync(this,api).run();
            } catch(Exception e) { if(!destroyed) {
                status=e instanceof TlsSelfTest.Failure?"No se pudo preparar la conexión segura. Código: "+((TlsSelfTest.Failure)e).code+". Solicita revisión de la app.":"No se pudo conectar. Revisa el Wi-Fi y vuelve a iniciar.";
                getSystemService(NotificationManager.class).notify(1,notice(this,status));
            } }
    }
    @Override public void onDestroy() {
        destroyed=true; if(task!=null)task.cancel(true);
        synchronized(listenerLock) {try{if(server!=null)server.close();}catch(IOException ignored){} server=null;}
        if(sync!=null) { sync.execute(()->{if(database!=null){database.close();database=null;}}); sync.shutdown(); sync=null; }
        status="Detenido"; super.onDestroy();
    }
    @Override public IBinder onBind(Intent intent) { return null; }
}
