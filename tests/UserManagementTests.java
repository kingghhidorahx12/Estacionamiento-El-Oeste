import mx.eloeste.core.*;
import mx.eloeste.desktop.*;
import org.json.*;
import java.util.*;

public final class UserManagementTests {
    static int checks;static void ok(boolean b,String text){checks++;if(!b)throw new AssertionError(text);}
    public static void main(String[] args)throws Exception{
        try(JdbcDb db=new JdbcDb(":memory:")){
            int[] requests={0};Api.Application application=new Api.Application(){public JSONObject status(){return new JSONObject().put("supported",true).put("version","0.4.0");}public JSONObject prepareUpdate(){requests[0]++;return new JSONObject().put("ok",true);}};
            Api api=new Api(db,System::currentTimeMillis,application);api.bootstrap("owner_test","65432198");OesteTests.Client admin=new OesteTests.Client(api,"owner_test","65432198");
            JSONObject body=new JSONObject().put("name"," Empleado1 ").put("password","482695").put("role","employee");String key=UUID.randomUUID().toString();
            ok(admin.post("users",body,key).status==200,"create mixed-case username");ok(admin.post("users",body,key).status==200,"lost response replay");ok(db.one("SELECT COUNT(*) AS n FROM users WHERE name='empleado1'").getInt("n")==1,"single account");
            JSONObject record=db.one("SELECT salt,hash,id FROM users WHERE name='empleado1'"),saved=db.one("SELECT fingerprint FROM requests WHERE id LIKE ?","%:"+key);JSONObject verifier=new JSONObject(saved.getString("fingerprint"));
            ok(verifier.getString("salt").equals(record.getString("salt"))&&verifier.getString("hash").equals(record.getString("hash")),"reuse existing strong PIN verifier");ok(!saved.toString().contains("482695"),"PIN not stored in request");
            ok(admin.post("users",new JSONObject(body.toString()).put("password","482696"),key).status==400,"changed PIN cannot replay original request");
            ok(admin.post("users",new JSONObject(body.toString()).put("role","admin"),key).status==400,"changed permission cannot replay original request");
            OesteTests.Client employee=new OesteTests.Client(api,"empleado1","482695");ok(employee.post("users",new JSONObject(body.toString()).put("name","other_test")).status==400,"employee cannot create accounts");
            ok(employee.post("application-update",new JSONObject()).status==400&&requests[0]==0,"employee cannot request update");
            ok(admin.get("application").getBoolean("supported"),"admin update status");String updateKey=UUID.randomUUID().toString();ok(admin.post("application-update",new JSONObject(),updateKey).status==200,"admin requests update");ok(admin.post("application-update",new JSONObject(),updateKey).status==200&&requests[0]==1,"update request replay not repeated");
            JSONObject change=new JSONObject().put("id",record.getString("id")).put("role","employee").put("active",false).put("pin","739215");String changeKey=UUID.randomUUID().toString();ok(admin.post("user-update",change,changeKey).status==200,"deactivate and change PIN");ok(admin.post("user-update",change,changeKey).status==200,"PIN reset replay");
            ok(admin.post("users",body,key).status==200,"original create replay survives subsequent PIN change");
            JSONObject owner=db.one("SELECT id FROM users WHERE name='owner_test'");ok(admin.post("user-update",new JSONObject().put("id",owner.getString("id")).put("active",false).put("role","employee").put("pin","")).status==400,"last admin protected");
            JSONObject legacyBody=new JSONObject().put("name","legacy_user").put("password","125896").put("role","employee");String legacyKey=UUID.randomUUID().toString(),legacyFingerprint=Security.password(Security.hash("/api/users\n"+legacyBody.toString()),api.meta("installation"));
            db.exec("INSERT INTO requests VALUES(?,?,?)",owner.getString("id")+":"+legacyKey,legacyFingerprint,"{\"ok\":true}");ok(admin.post("users",legacyBody,legacyKey).status==200,"old request fingerprints remain readable");
        }
        System.out.println("PASS · "+checks+" checks: users, protected replay, permissions, administrator and update authorization.");
    }
}
