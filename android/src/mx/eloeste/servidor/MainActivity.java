package mx.eloeste.servidor;

import android.app.*;
import android.os.*;
import android.content.*;
import android.graphics.*;
import android.graphics.drawable.GradientDrawable;
import android.text.InputType;
import android.view.*;
import android.webkit.*;
import android.widget.*;
import java.io.*;
import java.util.*;
import mx.eloeste.core.*;

public final class MainActivity extends Activity {
    private LinearLayout layout; private boolean unlocked=false,choosingCertificate=false,connecting=false;
    private EditText tlsPassword; private TextView statusText,urlText; private Button activateButton,openButton,connectButton;
    private CertificateShareServer sharing; private WebView qr; private final Handler handler=new Handler(Looper.getMainLooper());
    private final Runnable monitor=new Runnable() { public void run() { if(unlocked&&!connecting)updateStatus(); handler.postDelayed(this,1000); } };
    private android.content.SharedPreferences prefs(){return getSharedPreferences("private",0);}
    @Override public void onCreate(Bundle state){super.onCreate(state);if(Build.VERSION.SDK_INT>=33&&checkSelfPermission("android.permission.POST_NOTIFICATIONS")!=android.content.pm.PackageManager.PERMISSION_GRANTED)requestPermissions(new String[]{"android.permission.POST_NOTIFICATIONS"},1);show();handler.post(monitor);}
    private int dp(int n){return Math.round(n*getResources().getDisplayMetrics().density);}
    private Typeface face(){return Typeface.createFromAsset(getAssets(),"assets/fonts/Manrope-regular.ttf");}
    private GradientDrawable surface(int a,int b){GradientDrawable d=new GradientDrawable(GradientDrawable.Orientation.TL_BR,new int[]{a,b});d.setCornerRadius(dp(10));d.setStroke(dp(1),0xffc7d6df);return d;}
    private EditText field(String hint,boolean secret){
        EditText v=new EditText(this);v.setHint(hint);v.setSingleLine(true);v.setTextSize(16);v.setTypeface(face());v.setTextColor(0xff18334b);v.setPadding(dp(14),dp(12),dp(14),dp(12));v.setMinHeight(dp(50));v.setBackground(surface(0xffffffff,0xfff5f8fa));if(secret)v.setInputType(InputType.TYPE_CLASS_TEXT|InputType.TYPE_TEXT_VARIATION_PASSWORD);
        LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-1,-2);p.setMargins(0,dp(7),0,dp(12));layout.addView(v,p);return v;
    }
    private TextView text(String value){TextView t=new TextView(this);t.setText(value);t.setTextSize(14);t.setTypeface(face());t.setTextColor(0xff405b70);t.setPadding(0,dp(10),0,dp(10));t.setLineSpacing(dp(3),1);layout.addView(t);return t;}
    private void title(String value){TextView t=text(value);t.setTextSize(25);t.setTextColor(0xff102d48);t.setTypeface(Typeface.createFromAsset(getAssets(),"assets/fonts/Manrope-semibold.ttf"));}
    private Button button(String label,boolean primary,Runnable action){
        Button b=new Button(this);b.setText(label);b.setAllCaps(false);b.setTypeface(face());b.setTextSize(15);b.setTextColor(primary?0xff302b20:0xff143c5b);b.setMinHeight(dp(50));b.setBackground(primary?surface(0xffffe3a1,0xfff4c368):surface(0xffffffff,0xffe8f1f7));LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-1,-2);p.setMargins(0,dp(5),0,dp(9));b.setOnClickListener(v->{try{action.run();}catch(Exception e){toast(e.getMessage()==null?"No se pudo completar.":e.getMessage());}});layout.addView(b,p);return b;
    }
    private void toast(String value){Toast.makeText(this,value,Toast.LENGTH_LONG).show();}
    private void frame(){
        statusText=null;urlText=null;activateButton=null;openButton=null;connectButton=null;
        ScrollView scroll=new ScrollView(this);scroll.setFillViewport(true);scroll.setBackground(surface(0xfff6fafc,0xffe4eef5));LinearLayout center=new LinearLayout(this);center.setGravity(Gravity.CENTER_HORIZONTAL);center.setOrientation(LinearLayout.VERTICAL);center.setPadding(dp(20),dp(24),dp(20),dp(24));scroll.addView(center);
        layout=new LinearLayout(this);layout.setOrientation(LinearLayout.VERTICAL);layout.setPadding(dp(22),dp(18),dp(22),dp(22));layout.setBackground(surface(0xffffffff,0xfff4f8fb));center.addView(layout,new LinearLayout.LayoutParams(Math.min(getResources().getDisplayMetrics().widthPixels-dp(40),dp(620)),-2));
        ImageView scene=new ImageView(this);try(InputStream in=getAssets().open("assets/oeste-panorama.png")){BitmapFactory.Options options=new BitmapFactory.Options();options.inSampleSize=2;scene.setImageBitmap(BitmapFactory.decodeStream(in,null,options));}catch(IOException ignored){}scene.setScaleType(ImageView.ScaleType.CENTER_CROP);layout.addView(scene,new LinearLayout.LayoutParams(-1,dp(145)));
        LinearLayout brand=new LinearLayout(this);brand.setGravity(Gravity.CENTER_VERTICAL);brand.setPadding(0,dp(18),0,dp(8));ImageView mark=new ImageView(this);mark.setImageResource(getResources().getIdentifier("oeste_icon","drawable",getPackageName()));brand.addView(mark,new LinearLayout.LayoutParams(dp(52),dp(52)));
        TextView word=new TextView(this);word.setText("EL OESTE\nESTACIONAMIENTO");word.setTextColor(0xff102d48);word.setTextSize(19);word.setTypeface(Typeface.create("serif",Typeface.BOLD));word.setPadding(dp(14),0,0,0);brand.addView(word);layout.addView(brand);
        getWindow().setStatusBarColor(0xff102d48);getWindow().setNavigationBarColor(0xff102d48);setContentView(scroll);
    }
    private void show(){
        connecting=false;closeSharing();frame();
        if(!prefs().contains("pinHash")){
            title("Prepara tu estacionamiento");text("Conecta esta tablet al Wi-Fi del negocio y crea el acceso del administrador. La conexión segura se prepara automáticamente.");EditText name=field("Usuario administrador",false),pin=field("PIN personal · 6 a 12 dígitos",true);pin.setInputType(InputType.TYPE_CLASS_NUMBER|InputType.TYPE_NUMBER_VARIATION_PASSWORD);
            button("Crear acceso y preparar conexión",true,()->{String password=pin.getText().toString();Security.pin(password);AndroidDb db=new AndroidDb(this);try{Api api=new Api(db);if(api.needsSetup())api.bootstrap(name.getText().toString().trim().toLowerCase(Locale.ROOT),password);String salt=Security.random();prefs().edit().putString("pinSalt",salt).putString("pinHash",Security.password(password,salt)).apply();unlocked=true;startForegroundService(new Intent(this,ServerService.class));show();}finally{db.close();}});return;
        }
        if(!unlocked){
            title("Administrar la tablet");text("El servidor puede seguir activo con la configuración bloqueada.");statusText=text(ServerService.status);EditText pin=field("PIN de administración local",true);pin.setInputType(InputType.TYPE_CLASS_NUMBER|InputType.TYPE_NUMBER_VARIATION_PASSWORD);
            button("Desbloquear",true,()->{Rules.require(System.currentTimeMillis()>=prefs().getLong("pinUntil",0),"Espera 15 minutos antes de reintentar.");if(!Security.equal(Security.password(pin.getText().toString(),prefs().getString("pinSalt","")),prefs().getString("pinHash",""))){int fails=prefs().getInt("pinFailures",0)+1;prefs().edit().putInt("pinFailures",fails>=5?0:fails).putLong("pinUntil",fails>=5?System.currentTimeMillis()+900000:0).apply();toast("PIN incorrecto");}else{prefs().edit().remove("pinFailures").remove("pinUntil").apply();unlocked=true;show();}});return;
        }
        title("Tu conexión local");statusText=text(ServerService.status);urlText=text(LocalCertificates.url(this));urlText.setTextIsSelectable(true);urlText.setTextSize(18);urlText.setTextColor(0xff123d60);
        activateButton=button("Activar conexión",true,()->{startForegroundService(new Intent(this,ServerService.class));toast("Preparando la conexión…");});
        openButton=button("Abrir estacionamiento",true,()->{String url=LocalCertificates.url(this);Rules.require(!url.isEmpty(),"Conecta la tablet al Wi-Fi.");startActivity(new Intent(Intent.ACTION_VIEW,android.net.Uri.parse(url)));});
        connectButton=button("Conectar un celular",false,()->connectPhone());text("Para trabajar: tablet encendida y celulares en el mismo Wi-Fi. No necesitas crear ni importar server.p12.");
        LinearLayout advanced=new LinearLayout(this);advanced.setOrientation(LinearLayout.VERTICAL);advanced.setVisibility(View.GONE);button("Opciones avanzadas",false,()->advanced.setVisibility(advanced.getVisibility()==View.VISIBLE?View.GONE:View.VISIBLE));layout.addView(advanced);LinearLayout parent=layout;layout=advanced;
        text("Consulta remota opcional. Envía pagos desglosados y ocupación; las características del vehículo permanecen en la tablet.");EditText syncUrl=field("URL HTTPS del Worker /ingest",false),syncToken=field("Token de sincronización",true);syncUrl.setText(prefs().getString("syncUrl",""));
        button("Guardar consulta remota",false,()->{String url=syncUrl.getText().toString().trim(),token=syncToken.getText().toString();Rules.require(url.isEmpty()||url.matches("https://[a-zA-Z0-9.-]+/ingest"),"Usa la URL HTTPS exacta del Worker.");Rules.require(url.isEmpty()||token.length()>=32||prefs().getString("syncToken","").length()>=32,"Token: mínimo 32 caracteres.");android.content.SharedPreferences.Editor e=prefs().edit().putString("syncUrl",url);if(!token.isEmpty())e.putString("syncToken",token);e.apply();toast("Configuración guardada");});
        text("Certificado externo · sólo para una instalación administrada. Se conserva la compatibilidad con archivos importados anteriormente.");tlsPassword=field("Contraseña del archivo PKCS12",true);button("Importar certificado externo",false,()->{Intent choose=new Intent(Intent.ACTION_OPEN_DOCUMENT);choose.setType("*/*");choose.addCategory(Intent.CATEGORY_OPENABLE);choosingCertificate=true;startActivityForResult(choose,22);});
        button("Detener servidor",false,()->{stopService(new Intent(this,ServerService.class));updateStatus();});layout=parent;button("Bloquear configuración",false,()->{unlocked=false;show();});updateStatus();
    }
    private void updateStatus(){if(statusText!=null)statusText.setText(ServerService.status);if(urlText!=null)urlText.setText(LocalCertificates.url(this));boolean active=ServerService.status.startsWith("Activo")&&!LocalCertificates.url(this).isEmpty();if(activateButton!=null){activateButton.setVisibility(active?View.GONE:View.VISIBLE);activateButton.setEnabled(!ServerService.status.startsWith("Preparando"));}if(openButton!=null)openButton.setEnabled(active);if(connectButton!=null)connectButton.setEnabled(active);}
    private void connectPhone(){
        try{closeSharing();String url=LocalCertificates.url(this);Rules.require(!url.isEmpty(),"Conecta la tablet al Wi-Fi.");byte[] certificate=LocalCertificates.publicCa(this);String fingerprint=LocalCertificates.fingerprint(this);sharing=new CertificateShareServer(certificate,url,8788);sharing.start();connecting=true;frame();
            title("Conectar un celular");text("1. Conecta el celular al mismo Wi-Fi.\n2. Escanea este QR y descarga el certificado.\n3. Autorízalo en Ajustes siguiendo la guía del celular.");String target="http://"+LocalCertificates.wifi(this).first()+":8788"+sharing.path();
            qr=new WebView(this);qr.setBackgroundColor(Color.WHITE);qr.getSettings().setJavaScriptEnabled(true);qr.getSettings().setAllowFileAccess(false);qr.getSettings().setAllowContentAccess(false);qr.setWebViewClient(new WebViewClient(){@Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){return true;}});layout.addView(qr,new LinearLayout.LayoutParams(-1,dp(260)));qr.loadUrl("file:///android_asset/connect.html?target="+android.net.Uri.encode(target));
            TextView address=text(target);address.setTextIsSelectable(true);text("Comprueba la huella SHA-256 del certificado contra esta tablet antes de instalarlo:");TextView hash=text(fingerprint);hash.setTextSize(12);hash.setTextIsSelectable(true);
            text("La descarga es temporal y sólo contiene el certificado público. Nunca escribas el PIN en esa página. Cada teléfono necesita autorizar esta CA una sola vez. La descarga se cierra al salir de esta pantalla o en 10 minutos.");button("Volver a la conexión",true,()->show());
        }catch(Exception e){closeSharing();toast("No se pudo abrir la guía. Si importaste un certificado externo, usa su CA original.");}
    }
    private void closeSharing(){if(sharing!=null)try{sharing.close();}catch(IOException ignored){}sharing=null;if(qr!=null){qr.destroy();qr=null;}}
    @Override protected void onActivityResult(int request,int result,Intent data){super.onActivityResult(request,result,data);choosingCertificate=false;if(request!=22||result!=RESULT_OK||data==null||!unlocked)return;String password=tlsPassword.getText().toString();
        try(InputStream in=getContentResolver().openInputStream(data.getData());ByteArrayOutputStream out=new ByteArrayOutputStream()){byte[] b=new byte[4096];int n;while((n=in.read(b))!=-1){if(out.size()+n>131072)throw new IOException();out.write(b,0,n);}byte[] p12=out.toByteArray();LocalServer.tls(new ByteArrayInputStream(p12),password.toCharArray());Vault.save(this,password);try(FileOutputStream file=openFileOutput("server.p12",MODE_PRIVATE)){file.write(p12);}toast("Certificado importado. Detén y activa el servidor para aplicarlo.");show();}catch(Exception e){toast("No se pudo importar. Revisa el archivo y su contraseña.");}
    }
    @Override protected void onStop(){super.onStop();closeSharing();if(!choosingCertificate)unlocked=false;}
    @Override protected void onResume(){super.onResume();if(!unlocked&&!choosingCertificate)show();}
    @Override protected void onDestroy(){handler.removeCallbacks(monitor);closeSharing();super.onDestroy();}
}
