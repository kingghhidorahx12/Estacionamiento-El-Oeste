import mx.eloeste.core.*;
import mx.eloeste.desktop.*;
import org.json.*;
import java.util.concurrent.atomic.AtomicLong;

public final class PreferredPolicyTests {
 static int checks;static void ok(boolean value,String message){checks++;if(!value)throw new AssertionError(message);}
 public static void main(String[] args)throws Exception{
  JSONObject c=Rules.defaults();
  long[][] cases={{0,1000},{1,1000},{599999,1000},{600000,1000},{600001,1000},{3599999,1000},{3600000,1000},{3600001,2000},{4199999,2000},{4200000,2000},{4200001,2000},{7200000,2000},{7200001,3000}};
  for(long[] test:cases)ok(Rules.hourly(test[0],true,c)==test[1],"preferred whole-hour boundary "+test[0]);
  ok(c.getLong("freeNormal")==5000&&c.getLong("freePreferred")==4000,"normal free time fifty, preferred forty");
  ok(Rules.hourly(600000,false,c)==1000&&Rules.hourly(600001,false,c)==1500,"normal policy remains automatic and independent");
  ok(Rules.hourly(3600001,false,c)==2500&&Rules.hourly(4200001,false,c)==3000,"normal second hour keeps its own calculation");
  JSONObject legacy=new JSONObject(c.toString());legacy.remove("preferredFullHour");legacy.put("freePreferred",6000);
  ok(Rules.hourly(3600001,true,legacy)==1500,"previous snapshot retains historical formula");
  AtomicLong time=new AtomicLong(1794492000000L);
  try(JdbcDb db=new JdbcDb(":memory:")){
   Api old=new Api(db,time::get);old.bootstrap("owner_test","65432198");db.exec("UPDATE settings SET body=? WHERE version=1",legacy.toString());
   OesteTests.Client owner=new OesteTests.Client(old,"owner_test","65432198");JSONObject body=OesteTests.entry(1,"hourly","");body.getJSONObject("service").put("preferred",true);String previous=owner.post("entry",body).json.getString("id");
   JSONObject backup=Backups.export(db,"preferred-backup-12345",time.get());String qr=db.one("SELECT token FROM cards WHERE id=1").getString("token");
   Api current=new Api(db,time::get);owner.api=current;JSONObject state=owner.get("state");
   ok(state.getInt("version")==2&&state.getJSONObject("config").getBoolean("preferredFullHour"),"old installation receives a new version");
   ok(state.getJSONObject("config").getLong("freePreferred")==4000,"migration applies owner's corrected price");
   ok(db.one("SELECT token FROM cards WHERE id=1").getString("token").equals(qr),"QR retained");
   body=OesteTests.entry(2,"hourly","");body.getJSONObject("service").put("preferred",true);String fresh=owner.post("entry",body).json.getString("id");time.addAndGet(3600001);
   ok(Rules.quote(db.one("SELECT * FROM stays WHERE id=?",fresh),time.get()).getLong("total")==2000,"new preferred stay charges two flat hours");
   ok(Rules.quote(db.one("SELECT * FROM stays WHERE id=?",previous),time.get()).getLong("total")==1500,"active previous stay not rewritten");
   JSONObject pay=OesteTests.checkout(fresh,5000);String idempotency=OesteTests.key();Api.Reply payment=owner.post("checkout",pay,idempotency);
   ok(payment.status==200&&payment.json.getLong("total")==2000&&payment.json.getLong("change")==3000,"authoritative payment and change");
   ok(owner.post("checkout",pay,idempotency).json.getString("id").equals(payment.json.getString("id")),"retry does not duplicate payment");
   ok(owner.get("state").getJSONObject("report").getJSONObject("categories").getLong("parking_hourly_preferred")==2000,"report uses paid amount once");
   new Api(db,time::get);ok(owner.get("state").getInt("version")==2,"migration runs once");
   Api.Reply restore=owner.post("restore",new JSONObject().put("backup",backup).put("password","preferred-backup-12345").put("pin","65432198").put("confirmation","RESTAURAR"));ok(restore.status==200,"previous backup restores");owner=new OesteTests.Client(current,"owner_test","65432198");
   JSONObject rates=owner.get("state").getJSONObject("config");ok(rates.getBoolean("preferredFullHour")&&rates.getLong("freePreferred")==4000,"restore migrates future configuration");
  }
  for(boolean preferred:new boolean[]{false,true})for(long elapsed:new long[]{0,599999,600000,600001,3600000,3600001}){
   JSONObject service=new JSONObject().put("mode","free").put("preferred",preferred).put("wash","").put("rates",c);JSONObject stay=new JSONObject().put("entered",time.get()).put("service",service.toString());
   ok(Rules.quote(stay,time.get()+elapsed).getLong("total")== (preferred?4000:5000),"free-time price independent of elapsed duration");
  }
  System.out.println("PASS · "+checks+" preferred-customer checks, payment, migration and independent normal pricing.");
 }
}
