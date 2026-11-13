package mx.eloeste.core;
import org.json.*;
import java.io.*;
import java.nio.charset.Charset;
import java.text.Normalizer;
import java.time.*;
import java.time.format.DateTimeFormatter;

/** Only trusted receipt fields enter this encoder. Strip printer control characters. */
public final class PrinterTicket {
    private PrinterTicket(){}
    private static String safe(String value,boolean ascii){String s=value.replaceAll("[\\p{Cntrl}]"," ");return ascii?Normalizer.normalize(s,Normalizer.Form.NFD).replaceAll("\\p{M}","").replaceAll("[^\\x20-\\x7E]"," "):s;}
    private static String money(long cents){return "$"+java.math.BigDecimal.valueOf(cents,2).toPlainString();}
    public static byte[] encode(JSONObject profile,JSONObject receipt)throws IOException{
        JSONObject p=PrinterProfile.validate(profile);boolean ascii=p.getString("encoding").equals("ascii");Charset charset=Charset.forName(ascii?"US-ASCII":p.getString("encoding").equals("cp850")?"IBM850":"windows-1252");
        StringBuilder text=new StringBuilder("EL OESTE\nESTACIONAMIENTO\n\n");
        if(receipt.optBoolean("test"))text.append("PRUEBA DE IMPRESION\nUSB / LAN - ESC/POS\nSin cargo ni movimiento registrado\n");
        else{
            text.append("COMPROBANTE DE PAGO\n").append(safe(receipt.getString("id"),ascii)).append('\n');
            text.append(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm").withZone(ZoneId.of(Rules.ZONE)).format(Instant.ofEpochMilli(receipt.getLong("paid")))).append('\n');
            text.append(safe(receipt.getString("actor"),ascii)).append("\n\n");
            JSONArray lines=receipt.getJSONArray("lines");for(int i=0;i<lines.length();i++){JSONObject line=lines.getJSONObject(i);text.append(safe(line.getString("label"),ascii)).append(' ').append(money(line.getLong("cents"))).append('\n');}
            text.append("\nTOTAL ").append(money(receipt.getLong("total"))).append(" MXN\nCOPIA - NO REGISTRA OTRO PAGO\n");
        }
        text.append("\nGracias por tu visita\n");
        StringBuilder wrapped=new StringBuilder();for(String line:text.toString().split("\n",-1)){while(line.length()>p.getInt("columns")){wrapped.append(line,0,p.getInt("columns")).append('\n');line=line.substring(p.getInt("columns"));}wrapped.append(line).append('\n');}
        ByteArrayOutputStream out=new ByteArrayOutputStream();out.write(new byte[]{27,64,27,97,1,27,116,(byte)p.getInt("codePage")});out.write(wrapped.toString().getBytes(charset));for(int i=0;i<p.getInt("feedLines");i++)out.write(10);if(p.getBoolean("cutter"))out.write(new byte[]{29,86,1});return out.toByteArray();
    }
}
