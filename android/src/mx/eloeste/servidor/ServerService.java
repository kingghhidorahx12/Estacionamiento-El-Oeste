package mx.eloeste.servidor;

import android.app.*;
import android.content.*;
import android.net.*;
import android.os.*;
import java.io.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;
import mx.eloeste.core.*;

/** UI locking never changes the independent foreground server lifecycle. */
public final class ServerService extends Service {
    private LocalServer server; private AndroidDb database; private Api api;
    private ScheduledExecutorService local; private ExecutorService remote;
    private final AtomicBoolean syncing=new AtomicBoolean();
    private volatile boolean destroyed; private String addresses="";
    private final Object listenerLock=new Object();
    private ConnectivityManager.NetworkCallback network;
    public static volatile String status="Detenido",phase="stopped";
    public static volatile long changedAt=System.currentTimeMillis(),checkedAt=0;
    private static volatile Api activeApi;
    private static final ArrayDeque<String> events=new ArrayDeque<>();
    public static final String CHANNEL="oeste-local";
    public static synchronized void event(String message) {String line=new java.text.SimpleDateFormat("dd/MM HH:mm:ss",Locale.ROOT).format(new Date())+" · "+message;events.addFirst(line);while(events.size()>25)events.removeLast();}
    public static synchronized String diagnostics(){return String.join("\n",events);}
    public static int connections(){Api a=activeApi;return a==null?0:a.recentConnections();}
    public static long backup(){Api a=activeApi;return a==null?0:a.lastBackup();}
    private void state(String code,String text){if(!phase.equals(code)||!status.equals(text)){phase=code;status=text;changedAt=System.currentTimeMillis();event(text);getSharedPreferences("private",0).edit().putString("serverLastEvent",diagnostics()).apply();}getSystemService(NotificationManager.class).notify(1,notice(this,text));}
    public static void channel(Context c){c.getSystemService(NotificationManager.class).createNotificationChannel(new NotificationChannel(CHANNEL,"Servidor local",NotificationManager.IMPORTANCE_LOW));}
    static Notification notice(Context c,String text){channel(c);return new Notification.Builder(c,CHANNEL).setContentTitle("Estacionamiento El Oeste").setContentText(text).setSmallIcon(c.getResources().getIdentifier("oeste_notification","drawable",c.getPackageName())).setOngoing(true).setContentIntent(PendingIntent.getActivity(c,0,new Intent(c,MainActivity.class),PendingIntent.FLAG_IMMUTABLE)).build();}
    @Override public int onStartCommand(Intent intent,int flags,int startId){
        startForeground(1,notice(this,"Preparando conexión segura"));getSharedPreferences("private",0).edit().putBoolean("serverWanted",true).apply();
        if(local!=null){local.execute(this::tick);return START_STICKY;}
        destroyed=false;state("starting","Iniciando servidor seguro…");local=Executors.newSingleThreadScheduledExecutor();remote=Executors.newSingleThreadExecutor();
        local.scheduleWithFixedDelay(this::tick,0,30,TimeUnit.SECONDS);
        network=new ConnectivityManager.NetworkCallback(){@Override public void onAvailable(Network n){wake();}@Override public void onLost(Network n){wake();}@Override public void onLinkPropertiesChanged(Network n,LinkProperties p){wake();}};
        getSystemService(ConnectivityManager.class).registerDefaultNetworkCallback(network);return START_STICKY;
    }
    private void wake(){ScheduledExecutorService worker=local;if(worker!=null&&!worker.isShutdown())try{worker.execute(this::tick);}catch(RejectedExecutionException ignored){}}
    private void tick(){
        try{
            if(destroyed)return;
            if(database==null){database=new AndroidDb(this);api=new Api(database,System::currentTimeMillis,new TabletApplication(this));activeApi=api;}
            if(api.needsSetup())throw new IllegalStateException("setup");
            String current=String.join(",",LocalCertificates.wifi(this));
            if(current.isEmpty()){state("wifi","Sin Wi-Fi · los datos siguen guardados");return;}
            if(server==null||!current.equals(addresses)||LocalCertificates.expiring(this)){
                state("starting","Comprobando conexión segura…");javax.net.ssl.SSLContext tls=LocalCertificates.ensure(this);
                synchronized(listenerLock){if(destroyed)return;if(server!=null)server.close();server=null;server=new LocalServer(api,name->{try(InputStream asset=getAssets().open(name);ByteArrayOutputStream out=new ByteArrayOutputStream()){byte[] b=new byte[8192];int n;while((n=asset.read(b))!=-1)out.write(b,0,n);return out.toByteArray();}},8443,tls);server.start();addresses=current;}
            }
            if(destroyed)return;checkedAt=System.currentTimeMillis();state("active","Activo · conexión segura");
            // Internet synchronization cannot delay LAN recovery or TLS checks.
            if(syncing.compareAndSet(false,true))remote.execute(()->{try{new RemoteSync(this,api).run();}finally{syncing.set(false);}});
        }catch(Exception e){if(!destroyed)state(e instanceof TlsSelfTest.Failure?"tls":"error",e instanceof TlsSelfTest.Failure?"Error de conexión segura · "+((TlsSelfTest.Failure)e).code:"Error al iniciar · revisa el diagnóstico de administración");}
    }
    @Override public void onDestroy(){
        destroyed=true;if(network!=null)try{getSystemService(ConnectivityManager.class).unregisterNetworkCallback(network);}catch(Exception ignored){}
        synchronized(listenerLock){try{if(server!=null)server.close();}catch(IOException ignored){}server=null;}
        activeApi=null;if(remote!=null)remote.shutdownNow();if(local!=null){local.shutdownNow();}
        // A network worker can still unwind a timeout; close only after both workers end.
        ScheduledExecutorService l=local;ExecutorService r=remote;new Thread(()->{try{if(l!=null)l.awaitTermination(35,TimeUnit.SECONDS);if(r!=null)r.awaitTermination(35,TimeUnit.SECONDS);}catch(InterruptedException ignored){}if(database!=null)database.close();},"oeste-close").start();
        phase="stopped";status="Detenido";changedAt=System.currentTimeMillis();event("Servicio detenido");super.onDestroy();
    }
    @Override public IBinder onBind(Intent intent){return null;}
}
