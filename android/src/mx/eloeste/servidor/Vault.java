package mx.eloeste.servidor;

import android.content.*;
import android.security.keystore.*;
import android.util.Base64;
import java.security.*;
import javax.crypto.*;
import javax.crypto.spec.GCMParameterSpec;

final class Vault {
    private static javax.crypto.SecretKey key() throws Exception {
        KeyStore ks=KeyStore.getInstance("AndroidKeyStore"); ks.load(null);
        if(!ks.containsAlias("oeste-tls")) { KeyGenerator g=KeyGenerator.getInstance("AES","AndroidKeyStore"); g.init(new KeyGenParameterSpec.Builder("oeste-tls",KeyProperties.PURPOSE_ENCRYPT|KeyProperties.PURPOSE_DECRYPT).setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE).build()); g.generateKey(); }
        return (javax.crypto.SecretKey)ks.getKey("oeste-tls",null);
    }
    static void save(Context c,String value) throws Exception { Cipher cipher=Cipher.getInstance("AES/GCM/NoPadding"); cipher.init(Cipher.ENCRYPT_MODE,key()); byte[] data=cipher.doFinal(value.getBytes("UTF-8")); c.getSharedPreferences("private",0).edit().putString("tlsIv",Base64.encodeToString(cipher.getIV(),Base64.NO_WRAP)).putString("tlsValue",Base64.encodeToString(data,Base64.NO_WRAP)).apply(); }
    static String read(Context c) throws Exception { SharedPreferences p=c.getSharedPreferences("private",0); Cipher cipher=Cipher.getInstance("AES/GCM/NoPadding"); cipher.init(Cipher.DECRYPT_MODE,key(),new GCMParameterSpec(128,Base64.decode(p.getString("tlsIv",""),Base64.NO_WRAP))); return new String(cipher.doFinal(Base64.decode(p.getString("tlsValue",""),Base64.NO_WRAP)),"UTF-8"); }
}
