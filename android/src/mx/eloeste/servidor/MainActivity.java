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
    private long lastInteraction=SystemClock.elapsedRealtime(); private TextView connectionText,backupText;
    private EditText tlsPassword; private TextView statusText,urlText; private Button activateButton,openButton,connectButton;
    private CertificateShareServer sharing; private WebView qr; private final Handler handler=new Handler(Looper.getMainLooper());
    private boolean updateScreen=false,updateAuthorized=false,externalUpdate=false;private TextView updateText;private Button updateCheck,updateInstall;
    private final Runnable monitor=new Runnable() { public void run() { if(updateScreen&&updateAuthorized)refreshUpdateScreen();else if(!connecting)updateStatus();if((unlocked||updateAuthorized)&&SystemClock.elapsedRealtime()-lastInteraction>=prefs().getInt("maintenanceMinutes",5)*60000L){unlocked=false;updateAuthorized=false;ServerService.event("Administración bloqueada por inactividad; servicio independiente");show();}handler.postDelayed(this,1000); } };
    private android.content.SharedPreferences prefs(){return getSharedPreferences("private",0);}
    @Override public void onCreate(Bundle state){super.onCreate(state);if(Build.VERSION.SDK_INT>=33&&checkSelfPermission("android.permission.POST_NOTIFICATIONS")!=android.content.pm.PackageManager.PERMISSION_GRANTED)requestPermissions(new String[]{"android.permission.POST_NOTIFICATIONS"},1);if(AppUpdates.get(this).authorizePending(getIntent().getStringExtra("updateTicket"))){updateAuthorized=true;showUpdateScreen();}else show();handler.post(monitor);if(prefs().contains("pinHash")&&prefs().getBoolean("serverWanted",false)&&ServerService.phase.equals("stopped"))startForegroundService(new Intent(this,ServerService.class));}
    @Override protected void onNewIntent(Intent intent){super.onNewIntent(intent);setIntent(intent);if(AppUpdates.get(this).authorizePending(intent.getStringExtra("updateTicket"))){updateAuthorized=true;showUpdateScreen();}}
    private int dp(int n){return Math.round(n*getResources().getDisplayMetrics().density);}
    private Typeface face(){return Typeface.createFromAsset(getAssets(),"assets/fonts/Manrope-regular.ttf");}
    private GradientDrawable surface(int a,int b){GradientDrawable d=new GradientDrawable(GradientDrawable.Orientation.TL_BR,new int[]{a,b});d.setCornerRadius(dp(10));d.setStroke(dp(1),0xffc7d6df);return d;}
    private EditText field(String hint,boolean secret){
        EditText v=new EditText(this);v.setHint(hint);v.setSingleLine(true);v.setTextSize(16);v.setTypeface(face());v.setTextColor(0xff18334b);v.setPadding(dp(14),dp(12),dp(14),dp(12));v.setMinHeight(dp(50));v.setBackground(surface(0xffffffff,0xfff5f8fa));if(secret)v.setInputType(InputType.TYPE_CLASS_TEXT|InputType.TYPE_TEXT_VARIATION_PASSWORD);
        LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-1,-2);p.setMargins(0,dp(7),0,dp(12));layout.addView(v,p);return v;
    }
    private TextView text(String value){TextView t=new TextView(this);t.setText(value);t.setTextSize(16);t.setTypeface(face());t.setTextColor(0xff405b70);t.setPadding(0,dp(10),0,dp(10));t.setLineSpacing(dp(3),1);layout.addView(t);return t;}
    private void title(String value){TextView t=text(value);t.setTextSize(25);t.setTextColor(0xff102d48);t.setTypeface(Typeface.createFromAsset(getAssets(),"assets/fonts/Manrope-semibold.ttf"));}
    private Button button(String label,boolean primary,Runnable action){
        Button b=new Button(this);b.setText(label);b.setAllCaps(false);b.setTypeface(face());b.setTextSize(16);b.setTextColor(primary?0xfffff9eb:0xff192f36);b.setMinHeight(dp(50));b.setBackground(primary?surface(0xff192f36,0xff192f36):surface(0xffffffff,0xffe8f1f7));LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-1,-2);p.setMargins(0,dp(5),0,dp(9));b.setOnClickListener(v->{try{action.run();}catch(Exception e){toast(e.getMessage()==null?"No se pudo completar.":e.getMessage());}});layout.addView(b,p);return b;
    }
    private void toast(String value){Toast.makeText(this,value,Toast.LENGTH_LONG).show();}
    private void frame(){
        connectionText=null;backupText=null;statusText=null;urlText=null;activateButton=null;openButton=null;connectButton=null;
        ScrollView scroll=new ScrollView(this);scroll.setFillViewport(true);scroll.setBackground(surface(0xfff5f1e8,0xfff5f1e8));LinearLayout center=new LinearLayout(this);center.setGravity(Gravity.CENTER_HORIZONTAL);center.setOrientation(LinearLayout.VERTICAL);center.setPadding(dp(20),dp(24),dp(20),dp(24));scroll.addView(center);
        layout=new LinearLayout(this);layout.setOrientation(LinearLayout.VERTICAL);layout.setPadding(dp(22),dp(18),dp(22),dp(22));layout.setBackground(surface(0xfffffdf8,0xfffffdf8));center.addView(layout,new LinearLayout.LayoutParams(Math.min(getResources().getDisplayMetrics().widthPixels-dp(40),dp(620)),-2));
        LinearLayout brand=new LinearLayout(this);brand.setGravity(Gravity.CENTER_VERTICAL);brand.setPadding(0,dp(18),0,dp(8));ImageView mark=new ImageView(this);mark.setImageResource(getResources().getIdentifier("oeste_icon","drawable",getPackageName()));brand.addView(mark,new LinearLayout.LayoutParams(dp(52),dp(52)));
        TextView word=new TextView(this);word.setText("EL OESTE\nESTACIONAMIENTO");word.setTextColor(0xff102d48);word.setTextSize(19);word.setTypeface(Typeface.createFromAsset(getAssets(),"assets/fonts/Rye-Regular.ttf"));word.setPadding(dp(14),0,0,0);brand.addView(word);layout.addView(brand);
        getWindow().setStatusBarColor(0xff102d48);getWindow().setNavigationBarColor(0xff102d48);setContentView(scroll);
    }
    private void show(){
        updateScreen=false;connecting=false;closeSharing();frame();
        if(!prefs().contains("pinHash")){
            title("Prepara tu estacionamiento");text("Conecta esta tablet al Wi-Fi del negocio y crea el acceso del administrador. La conexión segura se prepara automáticamente.");EditText name=field("Usuario administrador",false),pin=field("PIN personal · 6 a 12 dígitos",true);pin.setInputType(InputType.TYPE_CLASS_NUMBER|InputType.TYPE_NUMBER_VARIATION_PASSWORD);
            button("Crear acceso y preparar conexión",true,()->{String password=pin.getText().toString();Security.pin(password);AndroidDb db=new AndroidDb(this);try{Api api=new Api(db);if(api.needsSetup())api.bootstrap(name.getText().toString().trim().toLowerCase(Locale.ROOT),password);String salt=Security.random();prefs().edit().putString("pinSalt",salt).putString("pinHash",Security.password(password,salt)).apply();unlocked=true;startForegroundService(new Intent(this,ServerService.class));show();}finally{db.close();}});return;
        }
        if(!unlocked){
            title("Servidor del estacionamiento");statusText=text(ServerService.status);statusText.setTextSize(27);statusText.setTypeface(Typeface.createFromAsset(getAssets(),"assets/fonts/Manrope-semibold.ttf"));
            connectionText=text("");backupText=text("");connectButton=button("Conectar un celular",true,()->connectPhone());
            button("Administración",false,()->unlockScreen());text("Puedes volver a El Muelle. El bloqueo de esta pantalla no detiene el servidor.");updateStatus();return;
        }
        title("Administración de la tablet");statusText=text(ServerService.status);urlText=text(LocalCertificates.url(this));urlText.setTextIsSelectable(true);urlText.setTextSize(18);urlText.setTextColor(0xff123d60);
        activateButton=button("Activar conexión",true,()->{startForegroundService(new Intent(this,ServerService.class));toast("Preparando la conexión…");});
        openButton=button("Abrir estacionamiento",true,()->{String url=LocalCertificates.url(this);Rules.require(!url.isEmpty(),"Conecta la tablet al Wi-Fi.");startActivity(new Intent(Intent.ACTION_VIEW,android.net.Uri.parse(url)));});
        connectButton=button("Conectar un celular",false,()->connectPhone());text("Para trabajar: tablet encendida y celulares en el mismo Wi-Fi. No necesitas crear ni importar server.p12.");
        button("Actualizar aplicación",false,()->{updateAuthorized=true;showUpdateScreen();});
        LinearLayout advanced=new LinearLayout(this);advanced.setOrientation(LinearLayout.VERTICAL);advanced.setVisibility(View.GONE);button("Opciones avanzadas",false,()->advanced.setVisibility(advanced.getVisibility()==View.VISIBLE?View.GONE:View.VISIBLE));layout.addView(advanced);LinearLayout parent=layout;layout=advanced;
        text("Consulta remota opcional. Envía pagos desglosados y ocupación; las características del vehículo permanecen en la tablet.");EditText syncUrl=field("URL HTTPS del Worker /ingest",false),syncToken=field("Token de sincronización",true);syncUrl.setText(prefs().getString("syncUrl",""));
        button("Guardar consulta remota",false,()->{String url=syncUrl.getText().toString().trim(),token=syncToken.getText().toString();Rules.require(url.isEmpty()||url.matches("https://[a-zA-Z0-9.-]+/ingest"),"Usa la URL HTTPS exacta del Worker.");Rules.require(url.isEmpty()||token.length()>=32||prefs().getString("syncToken","").length()>=32,"Token: mínimo 32 caracteres.");android.content.SharedPreferences.Editor e=prefs().edit().putString("syncUrl",url);if(!token.isEmpty())e.putString("syncToken",token);e.apply();toast("Configuración guardada");});
        text("Certificado externo · sólo para una instalación administrada. Se conserva la compatibilidad con archivos importados anteriormente.");tlsPassword=field("Contraseña del archivo PKCS12",true);button("Importar certificado externo",false,()->{Intent choose=new Intent(Intent.ACTION_OPEN_DOCUMENT);choose.setType("*/*");choose.addCategory(Intent.CATEGORY_OPENABLE);choosingCertificate=true;startActivityForResult(choose,22);});
        button("Detener servidor",false,()->{prefs().edit().putBoolean("serverWanted",false).apply();stopService(new Intent(this,ServerService.class));updateStatus();});text("Bloqueo de administración · minutos (valor inicial propuesto: 5)");EditText idle=field("De 1 a 120 minutos",false);idle.setInputType(InputType.TYPE_CLASS_NUMBER);idle.setText(String.valueOf(prefs().getInt("maintenanceMinutes",5)));button("Guardar tiempo de bloqueo",false,()->{int minutes=Integer.parseInt(idle.getText().toString());Rules.require(minutes>=1&&minutes<=120,"Elige de 1 a 120 minutos.");prefs().edit().putInt("maintenanceMinutes",minutes).apply();toast("Tiempo guardado");});
        button("Diagnóstico del servidor",false,()->new AlertDialog.Builder(this).setTitle("Estado y recuperación").setMessage("Estado: "+ServerService.status+"\nÚltima comprobación local: "+stamp(ServerService.checkedAt)+"\n\n"+ServerService.diagnostics()+"\n\nÚltimo registro conservado:\n"+prefs().getString("serverLastEvent","Sin registro anterior")).setPositiveButton("Cerrar",null).show());
        layout=parent;button("Bloquear configuración",false,()->{unlocked=false;show();});updateStatus();
    }
    private void unlockScreen(){connecting=false;frame();
            title("Administrar la tablet");text("El servidor puede seguir activo con la configuración bloqueada.");statusText=text(ServerService.status);EditText pin=field("PIN de administración local",true);pin.setInputType(InputType.TYPE_CLASS_NUMBER|InputType.TYPE_NUMBER_VARIATION_PASSWORD);
            button("Desbloquear",true,()->{Rules.require(System.currentTimeMillis()>=prefs().getLong("pinUntil",0),"Espera 15 minutos antes de reintentar.");if(!Security.equal(Security.password(pin.getText().toString(),prefs().getString("pinSalt","")),prefs().getString("pinHash",""))){int fails=prefs().getInt("pinFailures",0)+1;prefs().edit().putInt("pinFailures",fails>=5?0:fails).putLong("pinUntil",fails>=5?System.currentTimeMillis()+900000:0).apply();toast("PIN incorrecto");}else{prefs().edit().remove("pinFailures").remove("pinUntil").apply();unlocked=true;lastInteraction=SystemClock.elapsedRealtime();show();}});    }
    private String stamp(long value){return value==0?"Sin registro":new java.text.SimpleDateFormat("dd/MM HH:mm",Locale.getDefault()).format(new Date(value));}
    @Override public void onUserInteraction(){super.onUserInteraction();lastInteraction=SystemClock.elapsedRealtime();}
    private void updateStatus(){if(statusText!=null)statusText.setText(ServerService.status);if(connectionText!=null)connectionText.setText(ServerService.connections()+" conexiones recientes · últimos 3 minutos");if(backupText!=null)backupText.setText("Último respaldo generado: "+stamp(ServerService.backup())+"\nConserva la copia descargada fuera de la tablet.");if(urlText!=null)urlText.setText(LocalCertificates.url(this));boolean active=ServerService.status.startsWith("Activo")&&!LocalCertificates.url(this).isEmpty();if(activateButton!=null){activateButton.setVisibility(active?View.GONE:View.VISIBLE);activateButton.setEnabled(!ServerService.phase.equals("starting"));}if(openButton!=null)openButton.setEnabled(active);if(connectButton!=null)connectButton.setEnabled(active);}
    private void connectPhone(){
        try{closeSharing();String url=LocalCertificates.url(this);Rules.require(!url.isEmpty(),"Conecta la tablet al Wi-Fi.");byte[] certificate=LocalCertificates.publicCa(this);String fingerprint=LocalCertificates.fingerprint(this);sharing=new CertificateShareServer(certificate,url,8788);sharing.start();connecting=true;frame();
            title("Conectar un celular");text("1. Conecta el celular al mismo Wi-Fi.\n2. Escanea este QR y descarga el certificado.\n3. Autorízalo en Ajustes siguiendo la guía del celular.");String target="http://"+LocalCertificates.wifi(this).first()+":8788"+sharing.path();
            qr=new WebView(this);qr.setBackgroundColor(Color.WHITE);qr.getSettings().setJavaScriptEnabled(true);qr.getSettings().setAllowFileAccess(false);qr.getSettings().setAllowContentAccess(false);qr.setWebViewClient(new WebViewClient(){@Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){return true;}});layout.addView(qr,new LinearLayout.LayoutParams(-1,dp(260)));qr.loadUrl("file:///android_asset/connect.html?target="+android.net.Uri.encode(target));
            TextView address=text(target);address.setTextIsSelectable(true);text("Comprueba la huella SHA-256 del certificado contra esta tablet antes de instalarlo:");TextView hash=text(fingerprint);hash.setTextSize(12);hash.setTextIsSelectable(true);
            text("La descarga es temporal y sólo contiene el certificado público. Nunca escribas el PIN en esa página. Cada teléfono necesita autorizar esta CA una sola vez. La descarga se cierra al salir de esta pantalla o en 10 minutos.");button("Volver a la conexión",true,()->show());
        }catch(Exception e){closeSharing();toast("No se pudo abrir la guía. Si importaste un certificado externo, usa su CA original.");}
    }
    private void closeSharing(){if(sharing!=null)try{sharing.close();}catch(IOException ignored){}sharing=null;if(qr!=null){qr.destroy();qr=null;}}
    private void showUpdateScreen(){
        if(!updateAuthorized)return;connecting=false;closeSharing();frame();updateScreen=true;title("Actualizar El Oeste");text("Versión instalada: "+AppUpdates.get(this).status().optString("version"));
        updateText=text("");updateCheck=button("Buscar y preparar actualización",true,()->{AppUpdates.get(this).prepareUpdate();refreshUpdateScreen();});
        updateInstall=button("Instalar actualización",true,()->installUpdate());
        text("La descarga requiere Internet. Se comprueba que el archivo pertenezca a El Oeste y tenga la misma firma de esta instalación. Android te pedirá confirmar. Se conservan los datos y el certificado de la tablet.");
        button("Volver",false,()->{updateAuthorized=false;updateScreen=false;show();});refreshUpdateScreen();
    }
    private void refreshUpdateScreen(){if(updateText==null)return;org.json.JSONObject value=AppUpdates.get(this).status();String state=value.optString("state");updateText.setText(value.optString("message")+(state.equals("downloading")?"\n"+value.optInt("progress")+" %":""));updateCheck.setEnabled(!state.equals("checking")&&!state.equals("downloading"));updateInstall.setVisibility(state.equals("ready")?View.VISIBLE:View.GONE);}
    private void installUpdate(){
        if(!updateAuthorized)return;
        try{if(!getPackageManager().canRequestPackageInstalls()){externalUpdate=true;startActivityForResult(new Intent(android.provider.Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,android.net.Uri.parse("package:"+getPackageName())),71);return;}
            updateInstall.setEnabled(false);updateText.setText("Comprobando el instalador…");AppUpdates.get(this).installer((install,error)->{if(isFinishing()||!updateAuthorized)return;updateInstall.setEnabled(true);if(error!=null){toast(error);return;}try{externalUpdate=true;startActivityForResult(install,72);}catch(Exception e){externalUpdate=false;toast("No se pudo abrir el instalador de Android.");}});
        }catch(Exception e){externalUpdate=false;toast(e.getMessage()==null?"No se pudo abrir el instalador.":e.getMessage());}
    }
    @Override protected void onActivityResult(int request,int result,Intent data){super.onActivityResult(request,result,data);if(request==71){externalUpdate=false;if(updateAuthorized&&getPackageManager().canRequestPackageInstalls())installUpdate();else toast("Autoriza la instalación de actualizaciones de El Oeste para continuar.");return;}if(request==72){externalUpdate=false;return;}choosingCertificate=false;if(request!=22||result!=RESULT_OK||data==null||!unlocked)return;String password=tlsPassword.getText().toString();
        try(InputStream in=getContentResolver().openInputStream(data.getData());ByteArrayOutputStream out=new ByteArrayOutputStream()){byte[] b=new byte[4096];int n;while((n=in.read(b))!=-1){if(out.size()+n>131072)throw new IOException();out.write(b,0,n);}byte[] p12=out.toByteArray();LocalServer.tls(new ByteArrayInputStream(p12),password.toCharArray());Vault.save(this,password);try(FileOutputStream file=openFileOutput("server.p12",MODE_PRIVATE)){file.write(p12);}toast("Certificado importado. Detén y activa el servidor para aplicarlo.");show();}catch(Exception e){toast("No se pudo importar. Revisa el archivo y su contraseña.");}
    }
    @Override protected void onStop(){super.onStop();closeSharing();ServerService.event("Interfaz en segundo plano; servicio independiente");}
    @Override protected void onResume(){super.onResume();if(SystemClock.elapsedRealtime()-lastInteraction>=prefs().getInt("maintenanceMinutes",5)*60000L){unlocked=false;updateAuthorized=false;}if(!updateAuthorized&&AppUpdates.get(this).authorizePending(null)){updateAuthorized=true;updateScreen=true;lastInteraction=SystemClock.elapsedRealtime();}if(updateScreen&&updateAuthorized)showUpdateScreen();else if(!unlocked&&!choosingCertificate)show();ServerService.event("Interfaz visible; servicio independiente");}
    @Override protected void onDestroy(){handler.removeCallbacks(monitor);closeSharing();super.onDestroy();}
}
