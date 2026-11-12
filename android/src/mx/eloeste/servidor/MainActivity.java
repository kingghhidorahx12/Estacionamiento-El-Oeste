package mx.eloeste.servidor;

import android.app.*;
import android.os.*;
import android.content.*;
import android.widget.*;
import android.text.InputType;
import java.io.*;
import java.net.*;
import java.util.*;
import mx.eloeste.core.*;

public final class MainActivity extends Activity {
    private LinearLayout layout; private boolean unlocked=false,choosingCertificate=false; private EditText tlsPassword;
    private android.content.SharedPreferences prefs() { return getSharedPreferences("private",0); }
    @Override public void onCreate(Bundle state) { super.onCreate(state); if(Build.VERSION.SDK_INT>=33 && checkSelfPermission("android.permission.POST_NOTIFICATIONS")!=android.content.pm.PackageManager.PERMISSION_GRANTED) requestPermissions(new String[]{"android.permission.POST_NOTIFICATIONS"},1); show(); }
    private int dp(int value) { return Math.round(value*getResources().getDisplayMetrics().density); }
    private android.graphics.Typeface face() { return android.graphics.Typeface.createFromAsset(getAssets(),"assets/fonts/Manrope-regular.ttf"); }
    private EditText field(String hint,boolean secret) { EditText v=new EditText(this); v.setHint(hint); v.setSingleLine(true); v.setTextSize(15); v.setTypeface(face()); v.setPadding(dp(13),dp(10),dp(13),dp(10)); v.setMinHeight(dp(48)); android.graphics.drawable.GradientDrawable border=new android.graphics.drawable.GradientDrawable(); border.setColor(0xfffafcf3); border.setStroke(dp(1),0xffb9cdbc); border.setCornerRadius(dp(7)); v.setBackground(border); if(secret) v.setInputType(InputType.TYPE_CLASS_TEXT|InputType.TYPE_TEXT_VARIATION_PASSWORD); LinearLayout.LayoutParams params=new LinearLayout.LayoutParams(-1,-2); params.setMargins(0,dp(7),0,dp(10)); layout.addView(v,params); return v; }
    private void text(String value) { TextView t=new TextView(this); t.setText(value); t.setTextSize(15); t.setTypeface(face()); t.setTextColor(0xff29463d); t.setPadding(0,dp(12),0,dp(12)); layout.addView(t); }
    private void button(String label,Runnable action) { Button b=new Button(this); b.setText(label); b.setAllCaps(false); b.setTypeface(face()); b.setTextSize(13); b.setTextColor(0xff243f38); b.setMinHeight(dp(46)); android.graphics.drawable.GradientDrawable surface=new android.graphics.drawable.GradientDrawable(android.graphics.drawable.GradientDrawable.Orientation.TL_BR,new int[]{0xffedd29b,0xffd6ae67}); surface.setCornerRadius(dp(7)); surface.setStroke(dp(1),0xffc9a560); b.setBackground(surface); LinearLayout.LayoutParams params=new LinearLayout.LayoutParams(-1,-2); params.setMargins(0,dp(5),0,dp(8)); b.setOnClickListener(v->{ try { action.run(); } catch(Exception ex) { toast(ex.getMessage()==null?"No se pudo completar.":ex.getMessage()); } }); layout.addView(b,params); }
    private void toast(String value) { Toast.makeText(this,value,Toast.LENGTH_LONG).show(); }
    private void show() {
        ScrollView scroll=new ScrollView(this); scroll.setBackgroundColor(0xffeef3e6); layout=new LinearLayout(this); layout.setOrientation(LinearLayout.VERTICAL); layout.setPadding(dp(24),dp(28),dp(24),dp(24)); scroll.addView(layout); getWindow().setStatusBarColor(0xff234a47); getWindow().setNavigationBarColor(0xff234a47); setContentView(scroll);
        text("EL OESTE · SERVIDOR LOCAL"); text(ServerService.status);
        if(!prefs().contains("pinHash")) {
            text("Primera instalación. Crea el usuario del administrador y su PIN personal. Este PIN también protege la configuración inicial de la tablet.");
            EditText name=field("Usuario administrador",false),pin=field("PIN personal: 6 a 12 dígitos",true); pin.setInputType(InputType.TYPE_CLASS_NUMBER|InputType.TYPE_NUMBER_VARIATION_PASSWORD);
            button("Crear administrador",()->{ Security.pin(pin.getText().toString()); AndroidDb db=new AndroidDb(this); try { Api api=new Api(db); if(api.needsSetup()) api.bootstrap(name.getText().toString().trim().toLowerCase(Locale.ROOT),pin.getText().toString()); String salt=Security.random(); prefs().edit().putString("pinSalt",salt).putString("pinHash",Security.password(pin.getText().toString(),salt)).apply(); unlocked=true; show(); } finally { db.close(); } }); return;
        }
        if(!unlocked) {
            EditText pin=field("PIN de administración local",true);
            button("Desbloquear configuración",()->{ long until=prefs().getLong("pinUntil",0); Rules.require(System.currentTimeMillis()>=until,"Espera 15 minutos antes de reintentar."); if(!Security.equal(Security.password(pin.getText().toString(),prefs().getString("pinSalt","")),prefs().getString("pinHash",""))) { int fails=prefs().getInt("pinFailures",0)+1; prefs().edit().putInt("pinFailures",fails>=5?0:fails).putLong("pinUntil",fails>=5?System.currentTimeMillis()+900000:0).apply(); toast("PIN incorrecto"); } else { prefs().edit().remove("pinFailures").remove("pinUntil").apply(); unlocked=true; show(); } }); return;
        }
        text("HTTPS requiere un certificado para la IP fija de esta tablet. Genera la CA y server.p12 con scripts/tls.ps1; instala la CA en cada teléfono.");
        tlsPassword=field("Contraseña del archivo server.p12",true);
        button("Importar certificado PKCS12",()->{ Intent choose=new Intent(Intent.ACTION_OPEN_DOCUMENT); choose.setType("*/*"); choose.addCategory(Intent.CATEGORY_OPENABLE); choosingCertificate=true; startActivityForResult(choose,22); });
        button("Iniciar servidor",()->{ Rules.require(new File(getFilesDir(),"server.p12").exists(),"Importa primero el certificado."); startForegroundService(new Intent(this,ServerService.class)); new Handler().postDelayed(()->show(),1000); });
        button("Detener servidor",()->{ stopService(new Intent(this,ServerService.class)); new Handler().postDelayed(()->show(),500); });
        text("Direcciones IPv4 detectadas (usa la IP Wi-Fi reservada en el router):\n"+ips());
        text("Consulta remota opcional. Sólo se envían pagos desglosados y ocupación; los datos del vehículo permanecen locales.");
        EditText syncUrl=field("URL HTTPS del Worker /ingest",false),syncToken=field("Token de sincronización",true); syncUrl.setText(prefs().getString("syncUrl",""));
        button("Guardar consulta remota",()->{ String url=syncUrl.getText().toString().trim(); Rules.require(url.isEmpty()||url.matches("https://[a-zA-Z0-9.-]+/ingest"),"Usa la URL HTTPS exacta del Worker."); String token=syncToken.getText().toString(); Rules.require(url.isEmpty()||token.length()>=32||prefs().getString("syncToken","").length()>=32,"Token: mínimo 32 caracteres."); android.content.SharedPreferences.Editor e=prefs().edit().putString("syncUrl",url); if(!token.isEmpty()) e.putString("syncToken",token); e.apply(); toast("Configuración guardada"); });
        button("Bloquear configuración",()->{ unlocked=false; show(); });
    }
    @Override protected void onActivityResult(int request,int result,Intent data) { super.onActivityResult(request,result,data); choosingCertificate=false; if(request!=22||result!=RESULT_OK||data==null||!unlocked) return; String password=tlsPassword.getText().toString();
        try(InputStream in=getContentResolver().openInputStream(data.getData()); ByteArrayOutputStream out=new ByteArrayOutputStream()) { byte[] b=new byte[4096]; int n; while((n=in.read(b))!=-1) { if(out.size()+n>131072) throw new IOException("Certificado demasiado grande."); out.write(b,0,n); } byte[] p12=out.toByteArray(); LocalServer.tls(new ByteArrayInputStream(p12),password.toCharArray()); try(FileOutputStream file=openFileOutput("server.p12",MODE_PRIVATE)) { file.write(p12); } Vault.save(this,password); toast("Certificado importado. Reinicia el servidor para aplicarlo."); show(); } catch(Exception e) { toast("No se pudo importar. Revisa el archivo y su contraseña."); }
    }
    private String ips() { StringBuilder s=new StringBuilder(); try { Enumeration<NetworkInterface> all=NetworkInterface.getNetworkInterfaces(); while(all.hasMoreElements()) { Enumeration<InetAddress> addresses=all.nextElement().getInetAddresses(); while(addresses.hasMoreElements()) { InetAddress a=addresses.nextElement(); if(!a.isLoopbackAddress() && a instanceof Inet4Address) s.append("https://").append(a.getHostAddress()).append(":8443\n"); } } } catch(Exception ignored) {} return s.toString(); }
    @Override protected void onStop() { super.onStop(); if(!choosingCertificate) unlocked=false; }
    @Override protected void onResume() { super.onResume(); if(!unlocked&&!choosingCertificate) show(); }
}
