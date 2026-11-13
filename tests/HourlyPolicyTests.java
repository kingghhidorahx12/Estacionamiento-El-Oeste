import mx.eloeste.core.*;
import mx.eloeste.desktop.*;
import org.json.*;
import java.util.concurrent.atomic.AtomicLong;

public final class HourlyPolicyTests {
    static int checks;static void ok(boolean value,String message){checks++;if(!value)throw new AssertionError(message);}
    public static void main(String[] args)throws Exception{
        JSONObject rates=Rules.defaults();
        long[][] cases={{0,1000},{1,1000},{599999,1000},{600000,1000},{600001,1500},{3599999,1500},{3600000,1500},{3600001,2500},{4199999,2500},{4200000,2500},{4200001,3000},{7200000,3000},{7200001,4000},{7800000,4000},{7800001,4500},{10800000,4500}};
        for(long[] c:cases)ok(Rules.hourly(c[0],false,rates)==c[1],"normal boundary at "+c[0]);
        ok(Rules.hourly(600000,true,rates)==1000&&Rules.hourly(3600000,true,rates)==1000,"preferred hour remains ten pesos");
        ok(Rules.hourly(3600001,true,rates)==1500,"existing preferred partial remains unchanged");
        JSONObject legacy=new JSONObject(rates.toString());legacy.remove("normalFromStart");legacy.remove("normalPartial");
        ok(Rules.hourly(1,false,legacy)==1500&&Rules.hourly(3600001,false,legacy)==2000,"old snapshots preserve their agreed tariff");
        try{Rules.validateConfig(new JSONObject(rates.toString()).put("normalPartial",1600));throw new AssertionError("fraction above full hour");}catch(IllegalArgumentException expected){ok(true,"invalid fraction rejected");}
        AtomicLong time=new AtomicLong(1794492000000L);
        try(JdbcDb db=new JdbcDb(":memory:")){
            Api previous=new Api(db,time::get);previous.bootstrap("owner_test","65432198");db.exec("UPDATE settings SET body=? WHERE version=1",legacy.toString());
            OesteTests.Client owner=new OesteTests.Client(previous,"owner_test","65432198");String old=owner.post("entry",OesteTests.entry(1,"hourly","")).json.getString("id");
            JSONObject backup=Backups.export(db,"legacy-hourly-backup-123",time.get());
            String qr=db.one("SELECT token FROM cards WHERE id=1").getString("token");
            Api current=new Api(db,time::get);owner.api=current;JSONObject state=owner.get("state");
            ok(state.getInt("version")==2&&state.getJSONObject("config").getBoolean("normalFromStart"),"existing installation receives a new tariff version");
            ok(state.getJSONArray("stays").getJSONObject(0).getJSONObject("quote").getLong("total")==1500,"migration does not rewrite active rate snapshots");
            ok(db.one("SELECT token FROM cards WHERE id=1").getString("token").equals(qr),"QR identity preserved");
            String fresh=owner.post("entry",OesteTests.entry(2,"hourly","")).json.getString("id");
            JSONObject stay=db.one("SELECT * FROM stays WHERE id=?",fresh);ok(Rules.quote(stay,time.get()).getLong("total")==1000,"new entry starts at ten pesos");
            time.addAndGet(600000);ok(Rules.quote(stay,time.get()).getLong("total")==1000,"ten minutes inclusive");
            time.incrementAndGet();ok(Rules.quote(stay,time.get()).getLong("total")==1500,"one millisecond later is fifteen");
            ok(owner.post("checkout",OesteTests.checkout(fresh,2000).put("expectedTotal",1000)).status==400,"stale displayed total cannot be charged");
            Api.Reply payment=owner.post("checkout",OesteTests.checkout(fresh,2000));ok(payment.status==200&&payment.json.getLong("total")==1500&&payment.json.getLong("change")==500,"atomic checkout uses current server boundary");
            ok(owner.post("checkout",OesteTests.checkout(old,1500)).status==200,"legacy active stay closes under its snapshot");
            ok(owner.get("state").getJSONObject("report").getLong("total")==3000,"report reconciles both versions without duplicates");
            new Api(db,time::get);ok(owner.get("state").getInt("version")==2,"migration is not repeated on reopening");
            Api.Reply restored=owner.post("restore",new JSONObject().put("backup",backup).put("password","legacy-hourly-backup-123").put("pin","65432198").put("confirmation","RESTAURAR"));ok(restored.status==200,"legacy backup restores transactionally");
            owner=new OesteTests.Client(current,"owner_test","65432198");ok(owner.get("state").getJSONObject("config").getBoolean("normalFromStart"),"restored old config also migrates for future entries");
        }
        System.out.println("PASS · "+checks+" hourly policy checks, boundaries, snapshots, migration and restore.");
    }
}
