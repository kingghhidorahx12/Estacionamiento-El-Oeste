package mx.eloeste.core;
import org.json.*;

/** ESC/POS format matching the El Muelle setup. Device identity is never guessed. */
public final class PrinterProfile {
    private PrinterProfile(){}
    public static JSONObject defaults(){return new JSONObject().put("transport","usb").put("host","").put("port",9100).put("widthMm",80).put("columns",48).put("encoding","ascii").put("codePage",0).put("feedLines",8).put("cutter",false);}
    public static void lan(String host,int port){
        Rules.require(host.matches("[0-9]{1,3}(\\.[0-9]{1,3}){3}")&&port>=1&&port<=65535,"Escribe la IP local de la impresora y un puerto válido.");
        String[] parts=host.split("\\.");int[] ip=new int[4];for(int i=0;i<4;i++){ip[i]=Integer.parseInt(parts[i]);Rules.require(ip[i]<=255&&String.valueOf(ip[i]).equals(parts[i]),"IP local inválida.");}
        Rules.require(ip[0]==10||ip[0]==192&&ip[1]==168||ip[0]==172&&ip[1]>=16&&ip[1]<=31,"La impresora debe estar en una red local privada.");
    }
    public static JSONObject validate(JSONObject input){
        JSONObject p=defaults();for(String key:p.keySet())if(input.has(key))p.put(key,input.get(key));
        String type=p.getString("transport");Rules.require(type.equals("usb")||type.equals("lan"),"Elige USB o LAN.");
        Rules.require(p.getInt("widthMm")==58||p.getInt("widthMm")==80,"Papel: 58 u 80 mm.");
        Rules.require(p.getInt("columns")>=24&&p.getInt("columns")<=64,"Caracteres por línea: 24 a 64.");
        Rules.require(p.getInt("feedLines")>=5&&p.getInt("feedLines")<=16,"Salida final: 5 a 16 líneas.");
        Rules.require(p.getInt("codePage")>=0&&p.getInt("codePage")<=255,"Página ESC/POS inválida.");
        Rules.require(java.util.Arrays.asList("ascii","cp850","windows1252").contains(p.getString("encoding")),"Codificación desconocida.");
        p.getBoolean("cutter");if(type.equals("lan"))lan(p.getString("host").trim(),p.getInt("port"));
        p.put("host",p.getString("host").trim());
        if(type.equals("usb"))for(String key:new String[]{"deviceId","vendorId","productId","interfaceId","serial"})if(input.has(key))p.put(key,input.get(key));
        return p;
    }
}
