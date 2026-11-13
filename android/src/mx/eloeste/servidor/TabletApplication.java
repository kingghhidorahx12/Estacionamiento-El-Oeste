package mx.eloeste.servidor;
import android.content.Context;
import mx.eloeste.core.Api;
import org.json.JSONObject;

final class TabletApplication implements Api.Application {
    private final Context context;
    TabletApplication(Context c){context=c.getApplicationContext();}
    public JSONObject status(){return AppUpdates.get(context).status();}
    public JSONObject prepareUpdate(){return AppUpdates.get(context).prepareUpdate();}
    public JSONObject peripherals(){return ThermalPrinter.get(context).snapshot();}
    public JSONObject peripheralAction(String action,JSONObject body){return ThermalPrinter.get(context).action(action,body);}
}
