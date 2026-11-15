import mx.eloeste.core.*;
import mx.eloeste.desktop.*;
import org.json.*;
import java.util.*;
import java.util.concurrent.atomic.AtomicLong;

public final class QuickFlowTests {
    static int checks;
    static void ok(boolean value,String label){checks++;if(!value)throw new AssertionError(label);}
    static JSONObject entry(int card,String plate,String mode){return new JSONObject().put("card",card).put("vehicle",new JSONObject().put("plate",plate)).put("service",new JSONObject().put("mode",mode));}
    static JSONObject pay(String id){return new JSONObject().put("id",id).put("paymentConfirmed",true).put("vehicleConfirmed",true);}
    public static void main(String[] args)throws Exception{
        AtomicLong time=new AtomicLong(1794492000000L);
        try(JdbcDb db=new JdbcDb(":memory:")){
            Api api=new Api(db,time::get);api.bootstrap("OwnerCase","65432198");OesteTests.Client owner=new OesteTests.Client(api,"ownercase","65432198");
            owner.post("users",new JSONObject().put("name","Operador").put("password","482695").put("role","employee"));OesteTests.Client employee=new OesteTests.Client(api,"operador","482695");
            ok(db.one("SELECT COUNT(*) AS n FROM cards").getInt("n")==60,"50 regular plus ten provisional cards");
            ok(db.one("SELECT COUNT(DISTINCT token) AS n FROM cards").getInt("n")==60,"all QR secrets distinct");
            ok(employee.post("scan",new JSONObject().put("card",60)).json.getString("action").equals("entry"),"provisional card usable without extra activation");
            ok(employee.post("entry",entry(60,"  abc123a  ","hourly")).status==200,"plate only entry accepted");
            JSONObject stay=db.one("SELECT * FROM stays WHERE card_id=60 AND state='active'");String id=stay.getString("id");JSONObject vehicle=new JSONObject(stay.getString("vehicle"));
            ok(vehicle.getString("plate").equals("ABC123A"),"plate normalized");
            ok(vehicle.getString("type").isEmpty()&&vehicle.getString("color").isEmpty()&&vehicle.getString("brand").isEmpty(),"no invented type, brand or colour");
            ok(employee.post("scan",new JSONObject().put("card",60)).json.getString("stayId").equals(id),"assigned scan routes same stay to checkout");
            ok(employee.post("checkout",pay(id).put("paymentConfirmed",false)).status==400,"explicit payment confirmation required");
            ok(employee.post("checkout",pay(id).put("paymentConfirmed","true")).status==400,"string does not count as payment confirmation");
            ok(employee.post("checkout",pay(id).put("expectedTotal",1500)).status==400,"stale total blocked, never autocharges another amount");
            ok(db.one("SELECT COUNT(*) AS n FROM payments").getInt("n")==0,"failed confirmation has no payment");
            String key=UUID.randomUUID().toString();JSONObject body=pay(id).put("expectedTotal",1000);Api.Reply paid=employee.post("checkout",body,key);
            ok(paid.status==200&&paid.json.getLong("total")==1000,"no cash received field needed");
            ok(!paid.json.has("received")&&!paid.json.has("change"),"no invented cash tender/change in response");
            ok(employee.post("checkout",body,key).json.getString("id").equals(paid.json.getString("id")),"retry returns same payment");
            ok(db.one("SELECT COUNT(*) AS n FROM payments").getInt("n")==1&&api.pendingEvents().length()==1,"one payment and one cloud event");
            ok(owner.get("state").getJSONObject("report").getLong("total")==1000,"income counted once");
            ok(employee.post("scan",new JSONObject().put("card",60)).json.getString("action").equals("entry"),"provisional reusable after close");
            ok(owner.post("cancel-entry",new JSONObject().put("id",id).put("reason","No borrar pagos cerrados")).status==400,"closed payment cannot be cancelled");
            ok(employee.post("entry",entry(1,"","hourly")).status==400,"empty plate still needs explicit identifying notes");
            JSONObject wash=entry(1,"WASH123","wash_only");wash.getJSONObject("service").put("wash","auto");
            ok(employee.post("entry",wash).status==400,"wash cannot infer vehicle type from plate");
            wash.getJSONObject("vehicle").put("type","auto");ok(employee.post("entry",wash).status==200,"wash retains explicit type with no colour requirement");
            id=db.one("SELECT id FROM stays WHERE card_id=1 AND state='active'").getString("id");ok(employee.post("checkout",pay(id)).json.getLong("total")==12000,"wash still correct");
            id=employee.post("entry",entry(1,"FREE123","free")).json.getString("id");JSONObject resolution=pay(id).put("resolution",new JSONObject().put("acceptBase",true));
            ok(employee.post("checkout",resolution).status==400,"undefined coverage remains admin only");
            ok(owner.post("checkout",pay(id)).status==400,"admin also must explicitly authorize exception");
            Api.Reply resolved=owner.post("checkout",resolution);ok(resolved.status==200&&resolved.json.getLong("total")==5000,"admin approves base without typing amount or reason");
            JSONObject audit=new JSONObject(db.one("SELECT detail FROM audit WHERE action='administrative_resolution'").getString("detail"));
            ok(audit.getLong("extraCents")==0&&!audit.getString("coverageIssue").isEmpty(),"zero adjustment and coverage issue audited");
            // Simulate the old 35-card inventory. Preserve all old codes and states.
            db.exec("DELETE FROM cards WHERE id>35");db.exec("UPDATE cards SET state='reserve' WHERE id=31");db.exec("UPDATE cards SET state='suspended' WHERE id=32");
            String token=db.one("SELECT token FROM cards WHERE id=31").getString("token");JSONObject before=new JSONObject().put("token",token).put("state","reserve");
            JSONObject backup=Backups.export(db,"synthetic-backup-passphrase",time.get());
            Api migrated=new Api(db,time::get);ok(db.one("SELECT COUNT(*) AS n FROM cards").getInt("n")==60,"old collection expanded");
            ok(db.one("SELECT token,state FROM cards WHERE id=31").toString().equals(before.toString()),"old QR and reserved state unchanged");
            ok(db.one("SELECT state FROM cards WHERE id=32").getString("state").equals("suspended"),"manual suspension preserved");
            long audits=db.one("SELECT COUNT(*) AS n FROM audit WHERE action='card_inventory_expanded'").getLong("n");new Api(db,time::get);
            ok(db.one("SELECT COUNT(*) AS n FROM audit WHERE action='card_inventory_expanded'").getLong("n")==audits,"migration does not repeat or rotate codes");
            owner=new OesteTests.Client(migrated,"ownercase","65432198");
            ok(owner.post("restore",new JSONObject().put("backup",backup).put("password","synthetic-backup-passphrase").put("pin","65432198").put("confirmation","RESTAURAR")).status==200,"legacy encrypted backup accepted and expanded atomically");
            ok(db.one("SELECT COUNT(*) AS n FROM cards").getInt("n")==60&&db.one("SELECT token FROM cards WHERE id=31").getString("token").equals(token),"restore preserves old secrets and expands inventory");
        }
        System.out.println("PASS · "+checks+" quick-flow checks: plate only, confirmed payment, admin coverage, 60 cards and legacy restore.");
    }
}
