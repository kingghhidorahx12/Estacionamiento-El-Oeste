package mx.eloeste.servidor;

import android.app.*;
import android.content.*;
import android.os.*;
import java.io.*;
import java.util.concurrent.*;
import mx.eloeste.core.*;

public final class ServerService extends Service {
    private LocalServer server; private AndroidDb database; private ScheduledExecutorService sync;
    public static volatile String status="Detenido";
    public static final String CHANNEL="oeste-local";
    public static void channel(Context c) { NotificationManager nm=c.getSystemService(NotificationManager.class); nm.createNotificationChannel(new NotificationChannel(CHANNEL,"Servidor local",NotificationManager.IMPORTANCE_LOW)); }
    static Notification notice(Context c,String text) { channel(c); return new Notification.Builder(c,CHANNEL).setContentTitle("Estacionamiento El Oeste").setContentText(text).setSmallIcon(android.R.drawable.ic_menu_mylocation).setOngoing(true).setContentIntent(PendingIntent.getActivity(c,0,new Intent(c,MainActivity.class),PendingIntent.FLAG_IMMUTABLE)).build(); }
    @Override public int onStartCommand(Intent intent,int flags,int startId) {
        startForeground(1,notice(this,"Servidor HTTPS local en ejecución · puerto 8443"));
        if(server!=null) return START_STICKY;
        try {
            database=new AndroidDb(this); Api api=new Api(database); if(api.needsSetup()) throw new IllegalStateException("Configura el administrador.");
            try(InputStream in=new FileInputStream(new File(getFilesDir(),"server.p12"))) { server=new LocalServer(api,name->{ try(InputStream asset=getAssets().open(name); ByteArrayOutputStream out=new ByteArrayOutputStream()) { byte[] b=new byte[8192]; int n; while((n=asset.read(b))!=-1) out.write(b,0,n); return out.toByteArray(); } },8443,LocalServer.tls(in,Vault.read(this).toCharArray())); }
            server.start(); status="Activo · HTTPS :8443";
            sync=Executors.newSingleThreadScheduledExecutor();
            sync.scheduleWithFixedDelay(new RemoteSync(this,api),30,60,TimeUnit.SECONDS);
        } catch(Exception e) { status="No pudo iniciarse. Verifica certificado y configuración."; stopSelf(); }
        return START_STICKY;
    }
    @Override public void onDestroy() { if(sync!=null) sync.shutdownNow(); try { if(server!=null) server.close(); } catch(IOException ignored) {} if(database!=null) database.close(); server=null; if(status.startsWith("Activo")) status="Detenido"; super.onDestroy(); }
    @Override public IBinder onBind(Intent intent) { return null; }
}
