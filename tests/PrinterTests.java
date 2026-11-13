import mx.eloeste.core.*;
import mx.eloeste.desktop.*;
import org.json.*;
import java.io.*;
import java.net.*;
import java.util.*;

public final class PrinterTests {
    static int checks;static void ok(boolean v,String text){checks++;if(!v)throw new AssertionError(text);}
    public static void main(String[] args)throws Exception{
        JSONObject defaults=PrinterProfile.defaults();ok(defaults.getInt("widthMm")==80&&defaults.getInt("columns")==48&&defaults.getInt("port")==9100,"Muelle-compatible format defaults");
        ok(!defaults.getBoolean("cutter"),"cutter only after explicit configuration");
        for(String host:new String[]{"192.168.1.44","10.2.3.4","172.16.0.1"}){PrinterProfile.lan(host,9100);ok(true,"private printer address accepted");}
        for(String host:new String[]{"127.0.0.1","8.8.8.8","169.254.1.2","192.168.01.2","printer.local","192.168.1.2/path"}){try{PrinterProfile.lan(host,9100);throw new AssertionError(host);}catch(IllegalArgumentException expected){ok(true,"non-local or ambiguous address rejected");}}
        byte[] ticket=PrinterTicket.encode(defaults,new JSONObject().put("test",true));String ascii=new String(ticket,"US-ASCII");ok(ascii.contains("PRUEBA DE IMPRESION")&&ascii.contains("Sin cargo"),"test ticket does not create a payment");ok(ticket[2]==27&&ticket[3]==97&&ticket[4]==1,"ticket alignment centered");
        JSONObject receipt=new JSONObject().put("id","test-id").put("paid",1794492000000L).put("actor","Empleado\u001b@").put("total",12000).put("lines",new JSONArray().put(Rules.line("wash_auto","Lavado\u001b@\nAutomovil",12000)));
        byte[] copy=PrinterTicket.encode(defaults,receipt);String text=new String(copy,"US-ASCII");ok(text.contains("$120.00")&&text.contains("COPIA - NO REGISTRA OTRO PAGO"),"receipt prints existing integer-cent total");int escapes=0;for(byte b:copy)if(b==27)escapes++;ok(escapes==3,"untrusted text cannot inject printer commands");
        ByteArrayOutputStream output=new ByteArrayOutputStream();boolean[] closed={false};int[] connects={0};
        PrinterLan.send("192.168.1.4",9100,ticket,()->new Socket(){public void connect(SocketAddress target,int timeout){connects[0]++;ok(timeout==3000,"LAN connect bounded");}public void setSoTimeout(int value){}public OutputStream getOutputStream(){return output;}public void close(){closed[0]=true;}});
        ok(Arrays.equals(ticket,output.toByteArray())&&closed[0]&&connects[0]==1,"one complete ticket and connection released");
        PrinterLan.send("10.0.0.4",9100,new byte[0],()->new Socket(){public void connect(SocketAddress a,int t){}public void setSoTimeout(int v){}public OutputStream getOutputStream(){throw new AssertionError("probe must not print");}});ok(true,"TCP probe sends no paper commands");
        try(JdbcDb db=new JdbcDb(":memory:")){
            int[] calls={0};Api.Application application=new Api.Application(){public JSONObject status(){return new JSONObject();}public JSONObject prepareUpdate(){return new JSONObject();}public JSONObject peripherals(){return new JSONObject().put("supported",true);}public JSONObject peripheralAction(String action,JSONObject data){calls[0]++;return new JSONObject().put("requested",true);}};
            Api api=new Api(db,System::currentTimeMillis,application);api.bootstrap("owner_test","65432198");OesteTests.Client admin=new OesteTests.Client(api,"owner_test","65432198");admin.post("users",new JSONObject().put("name","employee_test").put("password","482695").put("role","employee"));OesteTests.Client employee=new OesteTests.Client(api,"employee_test","482695");
            ok(api.handle("GET","/api/peripherals",new JSONObject(),employee.token,"","").status==400,"printer configuration admin only");
            ok(employee.post("peripheral-action",new JSONObject().put("action","test")).status==400&&calls[0]==0,"employee cannot configure or print test tickets");
            String key=UUID.randomUUID().toString();JSONObject action=new JSONObject().put("action","test");ok(admin.post("peripheral-action",action,key).status==200,"admin requests paper test");ok(admin.post("peripheral-action",action,key).status==200&&calls[0]==1,"lost acknowledgement does not send second test");
            ok(db.one("SELECT COUNT(*) AS n FROM payments").getInt("n")==0,"printer test leaves payment ledger untouched");
            String stay=employee.post("entry",OesteTests.entry(1,"wash_only","auto")).json.getString("id"),payment=employee.post("checkout",OesteTests.checkout(stay,12000)).json.getString("id");
            ok(employee.post("print-receipt",new JSONObject().put("id",payment)).status==200,"employee can print own confirmed receipt");
            String ownerStay=admin.post("entry",OesteTests.entry(2,"wash_only","auto")).json.getString("id"),ownerPayment=admin.post("checkout",OesteTests.checkout(ownerStay,12000)).json.getString("id");
            ok(employee.post("print-receipt",new JSONObject().put("id",ownerPayment)).status==400,"employee cannot print another person's payment");
            ok(admin.get("state").getJSONObject("report").getLong("total")==24000,"printing never duplicates income");
        }
        System.out.println("PASS · "+checks+" printer checks (simulated transports; no physical printer).");
    }
}
