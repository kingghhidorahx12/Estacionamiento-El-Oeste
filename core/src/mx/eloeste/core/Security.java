package mx.eloeste.core;

import java.security.*;
import javax.crypto.*;
import javax.crypto.spec.PBEKeySpec;
import java.util.*;

public final class Security {
    private Security() {}
    public static String random() { byte[] b=new byte[32]; new SecureRandom().nextBytes(b); return hex(b); }
    public static String hash(String value) { try { return hex(MessageDigest.getInstance("SHA-256").digest(value.getBytes("UTF-8"))); } catch (Exception e) { throw new IllegalStateException(e); } }
    public static String password(String value, String salt) { try { PBEKeySpec spec=new PBEKeySpec(value.toCharArray(),salt.getBytes("UTF-8"),210000,256); try { return hex(SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(spec).getEncoded()); } finally { spec.clearPassword(); } } catch(Exception e) { throw new IllegalStateException(e); } }
    public static boolean equal(String a,String b) { try { return MessageDigest.isEqual(a.getBytes("UTF-8"),b.getBytes("UTF-8")); } catch(Exception e) { return false; } }
    public static void strong(String password) { Rules.require(password.length()>=12 && password.length()<=128,"Usa una contraseña de 12 a 128 caracteres."); }
    public static void pin(String value) { Rules.require(value.matches("[0-9]{6,12}"),"El PIN personal debe tener entre 6 y 12 dígitos."); }
    private static String hex(byte[] b) { StringBuilder s=new StringBuilder(); for(byte v:b) s.append(String.format(Locale.ROOT,"%02x",v&255)); return s.toString(); }
}
