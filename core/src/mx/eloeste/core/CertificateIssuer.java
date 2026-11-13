package mx.eloeste.core;

import java.io.*;
import java.math.BigInteger;
import java.net.InetAddress;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.security.cert.*;
import java.text.SimpleDateFormat;
import java.util.*;
import javax.security.auth.x500.X500Principal;

/** X.509 encoding only. Signing and verification use the platform JCA provider.
 * Private keys can remain non-exportable in AndroidKeyStore. */
public final class CertificateIssuer {
    private static final byte[] ALGORITHM=seq(oid("1.2.840.113549.1.1.11"),tag(5,new byte[0]));
    private CertificateIssuer() {}
    public static X509Certificate root(KeyPair keys,String name,Date now) throws Exception {
        X500Principal subject=new X500Principal("CN="+name+",O=Estacionamiento El Oeste");
        return issue(keys.getPublic(),keys.getPrivate(),subject,subject,now,3650,
            seq(extension("2.5.29.19",true,seq(tag(1,new byte[]{(byte)255}),integer(BigInteger.ZERO))),
                extension("2.5.29.15",true,bits(1,new byte[]{6})),extension("2.5.29.14",false,tag(4,keyId(keys.getPublic())))));
    }
    public static X509Certificate server(PublicKey key,PrivateKey issuerKey,X509Certificate root,Collection<String> ipv4,Date now) throws Exception {
        List<byte[]> names=new ArrayList<>();
        names.add(tag(0x82,"localhost".getBytes(StandardCharsets.US_ASCII)));
        Set<String> addresses=new TreeSet<>(ipv4); addresses.add("127.0.0.1");
        for(String ip:addresses) {
            if(!ip.matches("[0-9]{1,3}(\\.[0-9]{1,3}){3}")) throw new IllegalArgumentException("IPv4 inválida");
            byte[] address=InetAddress.getByName(ip).getAddress();
            if(address.length!=4) throw new IllegalArgumentException("IPv4 inválida");
            names.add(tag(0x87,address));
        }
        return issue(key,issuerKey,root.getSubjectX500Principal(),new X500Principal("CN=El Oeste local,O=Estacionamiento El Oeste"),now,365,
            seq(extension("2.5.29.19",true,seq()),extension("2.5.29.15",true,bits(5,new byte[]{(byte)0xa0})),
                extension("2.5.29.37",false,seq(oid("1.3.6.1.5.5.7.3.1"))),
                extension("2.5.29.17",false,seq(names.toArray(new byte[0][]))),
                extension("2.5.29.14",false,tag(4,keyId(key))),extension("2.5.29.35",false,seq(tag(0x80,keyId(root.getPublicKey()))))));
    }
    private static X509Certificate issue(PublicKey key,PrivateKey signer,X500Principal issuer,X500Principal subject,Date now,int days,byte[] extensions) throws Exception {
        Date before=new Date(now.getTime()-86400000L),after=new Date(now.getTime()+days*86400000L);
        BigInteger serial=new BigInteger(159,new SecureRandom()).add(BigInteger.ONE);
        byte[] body=seq(tag(0xa0,integer(BigInteger.valueOf(2))),integer(serial),ALGORITHM,issuer.getEncoded(),seq(time(before),time(after)),subject.getEncoded(),key.getEncoded(),tag(0xa3,extensions));
        Signature signature=Signature.getInstance("SHA256withRSA"); signature.initSign(signer); signature.update(body);
        byte[] certificate=seq(body,ALGORITHM,bits(0,signature.sign()));
        return (X509Certificate)CertificateFactory.getInstance("X.509").generateCertificate(new ByteArrayInputStream(certificate));
    }
    public static String fingerprint(X509Certificate certificate) throws Exception {
        byte[] digest=MessageDigest.getInstance("SHA-256").digest(certificate.getEncoded()); StringBuilder text=new StringBuilder();
        for(byte b:digest) { if(text.length()>0) text.append(':'); text.append(String.format(Locale.ROOT,"%02X",b&255)); } return text.toString();
    }
    private static byte[] time(Date date) { SimpleDateFormat f=new SimpleDateFormat("yyyyMMddHHmmss'Z'",Locale.ROOT); f.setTimeZone(TimeZone.getTimeZone("UTC")); return tag(0x18,f.format(date).getBytes(StandardCharsets.US_ASCII)); }
    private static byte[] keyId(PublicKey key) throws NoSuchAlgorithmException { return Arrays.copyOf(MessageDigest.getInstance("SHA-256").digest(key.getEncoded()),20); }
    private static byte[] extension(String id,boolean critical,byte[] value) { return critical?seq(oid(id),tag(1,new byte[]{(byte)255}),tag(4,value)):seq(oid(id),tag(4,value)); }
    private static byte[] integer(BigInteger value) { return tag(2,value.toByteArray()); }
    private static byte[] bits(int unused,byte[] value) { ByteArrayOutputStream out=new ByteArrayOutputStream(); out.write(unused); out.write(value,0,value.length); return tag(3,out.toByteArray()); }
    private static byte[] oid(String value) {
        String[] p=value.split("\\."); ByteArrayOutputStream out=new ByteArrayOutputStream(); out.write(Integer.parseInt(p[0])*40+Integer.parseInt(p[1]));
        for(int i=2;i<p.length;i++) { long n=Long.parseLong(p[i]); byte[] b=new byte[10]; int at=b.length; b[--at]=(byte)(n&127); while((n>>>=7)>0) b[--at]=(byte)((n&127)|128); out.write(b,at,b.length-at); } return tag(6,out.toByteArray());
    }
    private static byte[] seq(byte[]... parts) { ByteArrayOutputStream out=new ByteArrayOutputStream(); for(byte[] p:parts) out.write(p,0,p.length); return tag(0x30,out.toByteArray()); }
    private static byte[] tag(int tag,byte[] bytes) {
        ByteArrayOutputStream out=new ByteArrayOutputStream(); out.write(tag); int size=bytes.length;
        if(size<128) out.write(size); else { int count=0,n=size; while(n>0) {count++;n>>>=8;} out.write(128|count); for(int i=count-1;i>=0;i--) out.write(size>>>(8*i)); }
        out.write(bytes,0,bytes.length); return out.toByteArray();
    }
}
