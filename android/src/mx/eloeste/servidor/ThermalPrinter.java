package mx.eloeste.servidor;
import android.app.PendingIntent;
import android.content.*;
import android.hardware.usb.*;
import android.os.*;
import org.json.*;
import java.net.Socket;
import java.util.*;
import java.util.concurrent.*;
import java.io.*;
import mx.eloeste.core.*;

/** Explicit, short-lived USB/LAN printing. Never takes a USB interface by force. */
final class ThermalPrinter {
    private static ThermalPrinter instance;
    static synchronized ThermalPrinter get(Context c){if(instance==null)instance=new ThermalPrinter(c.getApplicationContext());return instance;}
    private final Context context;private final ExecutorService worker=Executors.newSingleThreadExecutor();
    private JSONObject profile;private String state="idle",message="Configura la impresora en Periféricos.",jobId="";private boolean busy;
    private int selectedSession=-1;
    private ThermalPrinter(Context c){context=c;try{String raw=prefs().getString("profile","");if(!raw.isEmpty())profile=PrinterProfile.validate(new JSONObject(raw));}catch(Exception ignored){}
        BroadcastReceiver receiver=new BroadcastReceiver(){public void onReceive(Context c,Intent intent){synchronized(ThermalPrinter.this){message="Permiso USB actualizado. Comprueba la impresora en Periféricos.";}}};
        IntentFilter filter=new IntentFilter(c.getPackageName()+".PRINTER_PERMISSION");if(Build.VERSION.SDK_INT>=33)c.registerReceiver(receiver,filter,Context.RECEIVER_NOT_EXPORTED);else c.registerReceiver(receiver,filter);
    }
    private android.content.SharedPreferences prefs(){return context.getSharedPreferences("printer",0);}
    private UsbManager usb(){return context.getSystemService(UsbManager.class);}
    private String serial(UsbDevice device){try{return usb().hasPermission(device)?Objects.toString(device.getSerialNumber(),""):"";}catch(Exception e){return "";}}
    JSONArray devices(){JSONArray list=new JSONArray();for(UsbDevice d:usb().getDeviceList().values())for(int i=0;i<d.getInterfaceCount();i++){UsbInterface f=d.getInterface(i);if(f.getInterfaceClass()==UsbConstants.USB_CLASS_PRINTER)list.put(new JSONObject().put("deviceId",d.getDeviceId()).put("vendorId",d.getVendorId()).put("productId",d.getProductId()).put("interfaceId",f.getId()).put("name",Objects.toString(d.getProductName(),"Impresora USB")).put("permission",usb().hasPermission(d)));}return list;}
    private UsbDevice match(JSONObject p){
        ArrayList<UsbDevice> candidates=new ArrayList<>();
        for(UsbDevice d:usb().getDeviceList().values())if(d.getVendorId()==p.optInt("vendorId",-1)&&d.getProductId()==p.optInt("productId",-1))for(int i=0;i<d.getInterfaceCount();i++){UsbInterface f=d.getInterface(i);if(f.getId()!=p.optInt("interfaceId",-1)||f.getInterfaceClass()!=UsbConstants.USB_CLASS_PRINTER)continue;
            String expected=p.optString("serial");if(!expected.isEmpty()){if(expected.equals(serial(d)))return d;}else candidates.add(d);
        }
        for(UsbDevice d:candidates)if(d.getDeviceId()==selectedSession)return d;
        return candidates.size()==1?candidates.get(0):null;
    }
    synchronized JSONObject snapshot(){JSONObject p=profile==null?PrinterProfile.defaults():new JSONObject(profile.toString());UsbDevice device=profile==null||!p.getString("transport").equals("usb")?null:match(p);
        return new JSONObject().put("supported",true).put("configured",profile!=null).put("profile",p).put("devices",devices()).put("usbPermission",device!=null&&usb().hasPermission(device)).put("job",new JSONObject().put("state",state).put("message",message).put("id",jobId)).put("message",message);
    }
    synchronized JSONObject action(String action,JSONObject data){
        Rules.require(!busy,"Hay un envío en curso. Espera su resultado antes de reenviar.");
        if(action.equals("save")){
            JSONObject next=PrinterProfile.validate(data);
            if(next.getString("transport").equals("usb")){
                boolean valid=false;JSONArray devices=devices();for(int i=0;i<devices.length();i++){JSONObject d=devices.getJSONObject(i);if(d.getInt("deviceId")==next.optInt("deviceId",-1)&&d.getInt("vendorId")==next.optInt("vendorId",-1)&&d.getInt("productId")==next.optInt("productId",-1)&&d.getInt("interfaceId")==next.optInt("interfaceId",-1))valid=true;}
                Rules.require(valid,"Selecciona una impresora USB detectada en la tablet.");selectedSession=next.getInt("deviceId");UsbDevice selected=match(next);Rules.require(selected!=null,"Impresora USB ambigua.");String serial=serial(selected);if(!serial.isEmpty())next.put("serial",serial);
            }
            profile=next;prefs().edit().putString("profile",profile.toString()).apply();message="Configuración guardada. La salida en papel se comprueba con una prueba.";state="idle";return snapshot();
        }
        Rules.require(profile!=null,"Configura la impresora en Periféricos primero.");
        Rules.require(Arrays.asList("probe","test","receipt").contains(action),"Acción inválida.");
        if(action.equals("probe"))Rules.require(profile.getString("transport").equals("lan"),"La comprobación TCP corresponde a LAN. En USB autoriza el equipo en la tablet y prueba la impresión.");
        JSONObject selected=new JSONObject(profile.toString());JSONObject receipt=action.equals("receipt")?new JSONObject(data.toString()):new JSONObject().put("test",true);
        busy=true;state="sending";message="Preparando envío…";jobId=UUID.randomUUID().toString();
        worker.execute(()->{try{byte[] bytes=action.equals("probe")?new byte[0]:PrinterTicket.encode(selected,receipt);if(selected.getString("transport").equals("lan"))PrinterLan.send(selected.getString("host"),selected.getInt("port"),bytes,Socket::new);else sendUsb(selected,bytes);
            synchronized(this){state="sent";message=action.equals("probe")?"Conexión TCP disponible. No se envió papel.":"Datos enviados. Confirma la salida en papel.";}
        }catch(Exception error){synchronized(this){state="uncertain";message=error.getMessage()==null?"No se confirmó el envío. Revisa conexión y papel antes de reenviar.":error.getMessage();}}finally{synchronized(this){busy=false;}}});return snapshot();
    }
    synchronized String requestUsbPermission(){
        Rules.require(profile!=null&&profile.getString("transport").equals("usb"),"Primero elige y guarda una impresora USB en Periféricos.");UsbDevice d=match(profile);
        // Android can hide the serial until permission is granted again. This
        // fallback requests permission only; printing still verifies the serial.
        if(d==null&&!profile.optString("serial").isEmpty()){
            JSONObject candidate=new JSONObject(profile.toString());candidate.remove("serial");UsbDevice hidden=match(candidate);if(hidden!=null&&!usb().hasPermission(hidden))d=hidden;
        }
        Rules.require(d!=null,"La impresora USB no está conectada o hay varias iguales. Selecciónala de nuevo.");
        if(usb().hasPermission(d))return "La impresora ya está autorizada para El Oeste.";
        int flags=PendingIntent.FLAG_UPDATE_CURRENT|(Build.VERSION.SDK_INT>=31?PendingIntent.FLAG_MUTABLE:0);usb().requestPermission(d,PendingIntent.getBroadcast(context,8,new Intent(context.getPackageName()+".PRINTER_PERMISSION").setPackage(context.getPackageName()),flags));return "Confirma el permiso en la ventana de Android.";
    }
    private void sendUsb(JSONObject p,byte[] bytes)throws Exception{
        UsbDevice d=match(p);if(d==null)throw new IOException("La impresora USB recordada no está disponible o es ambigua.");if(!usb().hasPermission(d))throw new IOException("Autoriza la impresora desde Periféricos en la tablet.");
        UsbDeviceConnection link=usb().openDevice(d);if(link==null)throw new IOException("No se pudo abrir la impresora USB.");UsbInterface claimed=null;
        try{
            for(int i=0;i<d.getInterfaceCount();i++){UsbInterface f=d.getInterface(i);if(f.getId()!=p.getInt("interfaceId")||f.getInterfaceClass()!=UsbConstants.USB_CLASS_PRINTER)continue;UsbEndpoint endpoint=null;for(int j=0;j<f.getEndpointCount();j++){UsbEndpoint e=f.getEndpoint(j);if(e.getDirection()==UsbConstants.USB_DIR_OUT&&e.getType()==UsbConstants.USB_ENDPOINT_XFER_BULK)endpoint=e;}
                if(endpoint==null)continue;if(!link.claimInterface(f,false))throw new IOException("USB ocupada. Termina el uso en la otra aplicación o usa LAN; El Oeste no libera la interfaz por fuerza.");claimed=f;
                int at=0;long deadline=SystemClock.elapsedRealtime()+10000;while(at<bytes.length){long remaining=deadline-SystemClock.elapsedRealtime();if(remaining<=0)throw new IOException("Envío USB sin confirmar. Revisa papel antes de reenviar.");int n=link.bulkTransfer(endpoint,bytes,at,Math.min(4096,bytes.length-at),(int)Math.min(3000,remaining));if(n<=0)throw new IOException("No se confirmó el envío USB completo. Revisa papel antes de reenviar.");at+=n;}return;
            }
            throw new IOException("La impresora no ofrece una salida USB compatible.");
        }finally{if(claimed!=null)link.releaseInterface(claimed);link.close();}
    }
}
