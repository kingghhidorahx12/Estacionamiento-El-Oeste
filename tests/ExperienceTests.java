import mx.eloeste.core.*;
import mx.eloeste.desktop.*;
import org.json.*;
import java.util.*;
import java.util.concurrent.atomic.AtomicLong;

public final class ExperienceTests {
    static int checks;static void ok(boolean value,String message){checks++;if(!value)throw new AssertionError(message);}
    static Api.Reply web(Api api,OesteTests.Client user,String method,String path,JSONObject body,boolean activity){return api.handle(method,"/api/"+path,body,user.token,user.csrf,UUID.randomUUID().toString(),activity,"synthetic-browser-12345");}
    public static void main(String[] args)throws Exception{
        AtomicLong time=new AtomicLong(1794492000000L);
        try(JdbcDb db=new JdbcDb(":memory:")){
            Api api=new Api(db,time::get);api.bootstrap("OwnerCase","65432198");OesteTests.Client owner=new OesteTests.Client(api,"ownercase","65432198");
            ok(owner.get("state").getString("name").equals("OwnerCase"),"visible capitalization retained");
            owner.post("users",new JSONObject().put("name","EmpleadoUno").put("password","482695").put("role","employee"));OesteTests.Client employee=new OesteTests.Client(api,"EMPLEADOUNO","482695");
            ok(employee.get("state").getString("name").equals("EmpleadoUno"),"case independent login, exact display");
            JSONObject card=db.one("SELECT * FROM cards WHERE id=1"),scan=new JSONObject().put("token",card.getString("token"));String key=UUID.randomUUID().toString();
            ok(employee.post("scan",scan,key).json.getString("action").equals("entry"),"free scan opens entry");
            String id=employee.post("entry",OesteTests.entry(1,"hourly","auto")).json.getString("id");
            Api.Reply assigned=employee.post("scan",scan,key);ok(assigned.json.getString("action").equals("exit")&&assigned.json.getString("stayId").equals(id),"same scan/key reads current state after entry");
            ok(employee.post("scan",new JSONObject().put("card",1)).json.getString("action").equals("exit"),"manual fallback follows same routing");
            ok(employee.post("scan",new JSONObject().put("card",31)).json.getString("action").equals("blocked"),"reserve not activated by scan");
            ok(employee.post("scan",new JSONObject().put("token","fake-code")).status==400,"unknown QR rejected");
            ok(db.one("SELECT COUNT(*) AS n FROM payments").getInt("n")==0,"scan never charges");
            JSONObject cancel=new JSONObject().put("id",id).put("reason","Cliente canceló el servicio");
            ok(employee.post("cancel-wash",cancel).status==400,"employee cannot cancel ordinary wash unauthorised");
            cancel.put("adminName","OwnerCase").put("adminPin","65432198");String cancelKey=UUID.randomUUID().toString();
            ok(employee.post("cancel-wash",cancel,cancelKey).status==200,"admin authorizes without changing employee session");
            ok(employee.post("cancel-wash",cancel,cancelKey).status==200,"authorized cancellation retry deduplicated");
            JSONObject saved=db.one("SELECT fingerprint FROM requests WHERE id LIKE ?","%:"+cancelKey);
            ok(!saved.toString().contains("65432198")&&new JSONObject(saved.getString("fingerprint")).getString("secret").equals("adminPin"),"no plaintext/fast admin PIN hash stored");
            ok(employee.post("cancel-entry",new JSONObject().put("id",id).put("reason","Alta duplicada por error")).status==400,"entry cancellation requires admin");
            ok(owner.post("cancel-entry",new JSONObject().put("id",id).put("reason","Alta duplicada por error")).status==200,"admin cancellation retained");
            ok(db.one("SELECT state FROM stays WHERE id=?",id).getString("state").equals("cancelled"),"stay archived, not deleted");
            ok(employee.post("scan",scan,key).json.getString("action").equals("entry"),"card reusable after cancellation");
            ok(owner.get("state").getJSONObject("report").getInt("entries")==0,"cancelled entry excluded from financial movement count");
            ok(db.one("SELECT COUNT(*) AS n FROM audit WHERE action='entry_cancelled'").getInt("n")==1,"reason and authorizer audited");
            String paid=employee.post("entry",OesteTests.entry(2,"wash_only","auto")).json.getString("id");employee.post("checkout",OesteTests.checkout(paid,12000));
            ok(owner.post("cancel-entry",new JSONObject().put("id",paid).put("reason","No borrar pagos existentes")).status==400,"closed payment never cancelled by entry action");
            ok(owner.get("state").getJSONObject("report").getLong("total")==12000,"single reconciled wash income");
            String nameId=db.one("SELECT id FROM users WHERE name='empleadouno'").getString("id");owner.post("user-update",new JSONObject().put("id",nameId).put("role","employee").put("active",true).put("pin","").put("displayName","Empleado Uno"));
            ok(employee.get("state").getString("name").equals("Empleado Uno"),"visible rename preserves valid session and actor history");
            ok(web(api,owner,"GET","state",new JSONObject(),true).status==200,"interactive web activity accepted");
            db.exec("INSERT OR REPLACE INTO meta VALUES('accessPolicy',?)","{\"adminMinutes\":1,\"employeeMinutes\":1}");
            time.addAndGet(300000);ok(web(api,owner,"GET","state",new JSONObject(),false).status==200,"legacy five-minute idle no longer locks administrator");
            time.addAndGet(3600000);ok(web(api,owner,"GET","state",new JSONObject(),false).status==200,"administrator remains signed in after an idle hour");
            ok(web(api,employee,"GET","state",new JSONObject(),false).status==200,"employee remains signed in after an idle hour");
            ok(!owner.get("state").has("accessPolicy"),"obsolete inactivity controls not exposed");
            ok(owner.post("access-policy",new JSONObject().put("adminMinutes",1).put("employeeMinutes",1)).status==400,"obsolete endpoint cannot re-enable inactivity");
            ok(web(api,owner,"POST","logout",new JSONObject(),false).status==200,"manual logout remains available");
            ok(web(api,owner,"GET","state",new JSONObject(),false).status==401,"manual logout revokes the session");owner=new OesteTests.Client(api,"ownercase","65432198");
            ok(api.recentConnections()==1,"authenticated browser presence bounded and counted");time.addAndGet(180001);ok(api.recentConnections()==0,"presence expires without fake active devices");
            JSONObject backup=Backups.export(db,"synthetic-backup-test-123",time.get());db.begin();try{Backups.restore(db,backup,"synthetic-backup-test-123");db.commit();}catch(Exception e){db.rollback();throw e;}
            ok(db.one("SELECT display_name FROM users WHERE name='empleadouno'").getString("display_name").equals("Empleado Uno"),"display name survives encrypted restore");
        }
        System.out.println("PASS · "+checks+" checks: scan routing, cancellations, display names, no idle lock and persistence.");
    }
}
