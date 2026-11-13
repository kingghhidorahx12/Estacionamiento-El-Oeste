package mx.eloeste.core;

import org.json.*;
import java.util.*;
import java.io.*;
import java.security.*;
import javax.crypto.*;
import javax.crypto.spec.*;
import java.util.zip.*;

/** Authenticated, encrypted application backups. Sessions are intentionally never restored. */
public final class Backups {
    private Backups() {}
    private static final String[] TABLES={"settings","users","cards","stays","monthly","payments","requests","audit","outbox","meta"};
    private static byte[] random(int n) { byte[] b=new byte[n]; new SecureRandom().nextBytes(b); return b; }
    private static SecretKeySpec key(String password,byte[] salt) throws Exception { Security.strong(password); PBEKeySpec spec=new PBEKeySpec(password.toCharArray(),salt,210000,256); try { return new SecretKeySpec(SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(spec).getEncoded(),"AES"); } finally { spec.clearPassword(); } }
    public static JSONObject export(Db db,String password,long at) throws Exception {
        JSONObject tables=new JSONObject(); for(String table:TABLES) tables.put(table,db.query("SELECT * FROM "+table));
        JSONObject document=new JSONObject().put("application","mx.eloeste.servidor").put("schema",1).put("created",at).put("tables",tables);
        byte[] raw=document.toString().getBytes("UTF-8"); Rules.require(raw.length<=32*1024*1024,"El respaldo supera el tamaño permitido para esta versión.");
        ByteArrayOutputStream compressed=new ByteArrayOutputStream(); try(GZIPOutputStream gzip=new GZIPOutputStream(compressed)) { gzip.write(raw); }
        byte[] salt=random(32),iv=random(12); Cipher cipher=Cipher.getInstance("AES/GCM/NoPadding"); cipher.init(Cipher.ENCRYPT_MODE,key(password,salt),new GCMParameterSpec(128,iv)); cipher.updateAAD("el-oeste-backup-v1".getBytes("UTF-8"));
        return new JSONObject().put("format","el-oeste-backup-v1").put("salt",Base64.getEncoder().encodeToString(salt)).put("iv",Base64.getEncoder().encodeToString(iv)).put("data",Base64.getEncoder().encodeToString(cipher.doFinal(compressed.toByteArray())));
    }
    public static void restore(Db db,JSONObject envelope,String password) throws Exception {
        Rules.require(envelope.getString("format").equals("el-oeste-backup-v1"),"Formato de respaldo desconocido.");
        byte[] salt=Base64.getDecoder().decode(envelope.getString("salt")),iv=Base64.getDecoder().decode(envelope.getString("iv")),encrypted=Base64.getDecoder().decode(envelope.getString("data"));
        Rules.require(salt.length==32&&iv.length==12&&encrypted.length<=8*1024*1024,"Respaldo inválido o demasiado grande.");
        Cipher cipher=Cipher.getInstance("AES/GCM/NoPadding"); cipher.init(Cipher.DECRYPT_MODE,key(password,salt),new GCMParameterSpec(128,iv)); cipher.updateAAD("el-oeste-backup-v1".getBytes("UTF-8")); byte[] decrypted;
        try { decrypted=cipher.doFinal(encrypted); } catch(GeneralSecurityException e) { throw new IllegalArgumentException("Contraseña de respaldo incorrecta o archivo alterado."); }
        ByteArrayOutputStream out=new ByteArrayOutputStream(); try(GZIPInputStream gzip=new GZIPInputStream(new ByteArrayInputStream(decrypted))) { byte[] b=new byte[8192]; int n; while((n=gzip.read(b))!=-1) { Rules.require(out.size()+n<=32*1024*1024,"Respaldo descomprimido demasiado grande."); out.write(b,0,n); } }
        JSONObject document=new JSONObject(out.toString("UTF-8")); Rules.require(document.getString("application").equals("mx.eloeste.servidor")&&document.getInt("schema")==1,"Respaldo de otra aplicación o versión."); JSONObject tables=document.getJSONObject("tables"); Rules.require(tables.length()==TABLES.length,"Respaldo incompleto.");
        for(String table:TABLES) { JSONArray rows=tables.getJSONArray(table); Rules.require(rows.length()<=200000,"Demasiados registros."); JSONArray schema=db.query("PRAGMA table_info("+table+")"); String[] columns=new String[schema.length()]; for(int j=0;j<columns.length;j++) columns[j]=schema.getJSONObject(j).getString("name");
            db.exec("DELETE FROM "+table);
            String placeholders=String.join(",",Collections.nCopies(columns.length,"?")); String sql="INSERT INTO "+table+" ("+String.join(",",columns)+") VALUES("+placeholders+")";
            for(int i=0;i<rows.length();i++) { JSONObject row=rows.getJSONObject(i);
                if(table.equals("users")&&!row.has("display_name")) row.put("display_name",row.getString("name"));
                Rules.require(row.length()==columns.length,"Columnas de respaldo incompatibles."); Object[] values=new Object[columns.length]; for(int j=0;j<columns.length;j++) { Rules.require(row.has(columns[j]),"Falta columna de respaldo."); Object value=row.get(columns[j]); Rules.require(value==JSONObject.NULL||value instanceof Number||value instanceof String,"Tipo de respaldo inválido."); values[j]=value==JSONObject.NULL?null:value; } db.exec(sql,values); }
        }
        Rules.require(db.one("SELECT COUNT(*) AS n FROM cards").getInt("n")==35,"El respaldo no contiene las 35 tarjetas.");
        Rules.require(db.one("SELECT COUNT(*) AS n FROM stays WHERE state='active'").getInt("n")<=30,"Ocupación inválida.");
        Rules.require(db.one("SELECT COUNT(*) AS n FROM users WHERE role='admin' AND active=1").getInt("n")>0,"El respaldo no contiene administrador activo.");
        Rules.require(db.one("SELECT COUNT(*) AS n FROM stays s LEFT JOIN cards c ON c.id=s.card_id WHERE s.state='active' AND (c.id IS NULL OR c.state NOT IN ('assigned','lost'))").getInt("n")==0,"Inconsistencia entre estancias y tarjetas.");
        Rules.require(db.one("SELECT COUNT(*) AS n FROM cards c WHERE c.state='assigned' AND NOT EXISTS(SELECT 1 FROM stays s WHERE s.card_id=c.id AND s.state='active')").getInt("n")==0,"Tarjetas asignadas sin estancia.");
        JSONArray payments=db.query("SELECT * FROM payments"); for(int i=0;i<payments.length();i++) { JSONObject p=payments.getJSONObject(i); JSONArray lines=new JSONArray(p.getString("lines")); long total=0; for(int j=0;j<lines.length();j++) total+=Rules.amount(lines.getJSONObject(j),"cents"); Rules.require(total==p.getLong("total"),"Pago de respaldo sin conciliar."); }
        JSONArray settings=db.query("SELECT * FROM settings ORDER BY version DESC LIMIT 1"); Rules.require(settings.length()==1,"Respaldo sin configuración."); JSONObject config=new JSONObject(settings.getJSONObject(0).getString("body")); Rules.validateConfig(config);
        db.exec("DELETE FROM sessions"); db.exec("DELETE FROM attempts");
        // Reconcile the whole local history after restoring an earlier copy; remote records remain immutable.
        db.exec("UPDATE outbox SET confirmed=0"); db.exec("DELETE FROM meta WHERE id='lastSync'");
        db.exec("INSERT OR REPLACE INTO meta VALUES('eventEpoch',?)",Security.random());
    }
}
