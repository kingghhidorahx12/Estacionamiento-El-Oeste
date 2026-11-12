package mx.eloeste.servidor;
import android.content.*;
import android.app.*;
public final class BootReceiver extends BroadcastReceiver {
    public void onReceive(Context context,Intent intent) { if(!Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) return; ServerService.channel(context); Notification n=ServerService.notice(context,"Tablet reiniciada. Abre El Oeste y comprueba el servidor local."); context.getSystemService(NotificationManager.class).notify(2,n); }
}
