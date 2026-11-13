import mx.eloeste.core.*;
import java.security.*;
import java.security.cert.X509Certificate;
import java.util.*;
import javax.net.ssl.*;

public final class TlsSelfTestTests {
    static int checks;
    static KeyPair pair()throws Exception{KeyPairGenerator g=KeyPairGenerator.getInstance("RSA");g.initialize(2048);return g.generateKeyPair();}
    static void rejected(SSLContext context,X509Certificate root)throws Exception{
        try{TlsSelfTest.verify(context,root);throw new AssertionError("broken TLS reported ready");}
        catch(TlsSelfTest.Failure expected){if(!expected.code.equals("TLS12"))throw new AssertionError(expected.code);checks++;}
    }
    public static void main(String[] args)throws Exception{
        KeyPair ca=pair(),leafKeys=pair();X509Certificate root=CertificateIssuer.root(ca,"El Oeste CA prueba",new Date()),leaf=CertificateIssuer.server(leafKeys.getPublic(),ca.getPrivate(),root,List.of(),new Date());
        SSLContext valid=LocalServer.tls(leafKeys.getPrivate(),new X509Certificate[]{leaf,root});
        TlsSelfTest.verify(valid,root);checks++; // Real TLS 1.2 ECDHE-RSA and TLS 1.3 with chain + hostname validation.
        KeyPair foreign=pair();X509Certificate foreignRoot=CertificateIssuer.root(foreign,"Otra CA",new Date());rejected(valid,foreignRoot);
        rejected(LocalServer.tls(pair().getPrivate(),new X509Certificate[]{leaf,root}),root);
        SSLContext empty=SSLContext.getInstance("TLS");empty.init(new KeyManager[0],null,null);rejected(empty,root);
        System.out.println("PASS · "+checks+" pruebas de inicio: TLS 1.2/1.3 real; rechazo de CA ajena, clave incorrecta y servidor sin clave.");
    }
}
