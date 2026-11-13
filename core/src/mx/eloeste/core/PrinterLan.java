package mx.eloeste.core;
import java.net.*;
import java.io.*;
import java.util.concurrent.*;
import java.util.function.Supplier;

public final class PrinterLan {
    private PrinterLan(){}
    public static void send(String host,int port,byte[] bytes,Supplier<Socket> factory)throws Exception{
        PrinterProfile.lan(host,port);Rules.require(bytes!=null&&bytes.length<=1048576,"Comprobante demasiado grande.");
        try(Socket socket=factory.get()){
            FutureTask<Void> task=new FutureTask<>(()->{socket.connect(new InetSocketAddress(host,port),3000);socket.setSoTimeout(3000);if(bytes.length>0){socket.getOutputStream().write(bytes);socket.getOutputStream().flush();}return null;});
            Thread writer=new Thread(task,"oeste-printer-lan");writer.setDaemon(true);writer.start();
            try{task.get(10,TimeUnit.SECONDS);}catch(TimeoutException e){task.cancel(true);throw new IOException("La impresora no respondió a tiempo. Revisa el papel antes de reenviar.");}catch(ExecutionException e){throw new IOException("No se completó el envío. Revisa conexión y papel antes de reenviar.");}
        }
    }
}
