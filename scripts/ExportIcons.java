import java.awt.*;
import java.awt.geom.*;
import java.awt.image.BufferedImage;
import java.nio.file.*;
import javax.imageio.ImageIO;

/** Raster exports of the code-native El Oeste mark for PWA platform icon requirements. */
public final class ExportIcons {
 public static void main(String[] args)throws Exception{for(int size:new int[]{180,192,512}){
  BufferedImage image=new BufferedImage(size,size,BufferedImage.TYPE_INT_RGB);Graphics2D g=image.createGraphics();g.setRenderingHint(RenderingHints.KEY_ANTIALIASING,RenderingHints.VALUE_ANTIALIAS_ON);g.scale(size/64.0,size/64.0);g.setColor(new Color(0x234a47));g.fillRect(0,0,64,64);g.setColor(new Color(0x42625a));g.setStroke(new BasicStroke(1));g.draw(new Rectangle2D.Double(13,12,37,40));
  g.setPaint(new GradientPaint(18,15,new Color(0xe2c78f),48,46,new Color(0xb08a4b)));g.setStroke(new BasicStroke(4.5f,BasicStroke.CAP_BUTT,BasicStroke.JOIN_MITER));Path2D p=new Path2D.Double();p.moveTo(20,45);p.lineTo(20,19);p.lineTo(33,19);p.curveTo(50,19,50,38,33,38);p.lineTo(26,38);g.draw(p);
  g.setColor(new Color(0xf0dfb2));g.setStroke(new BasicStroke(2));g.draw(new Line2D.Double(37,46,49,30));g.setColor(new Color(0xb59760));Path2D road=new Path2D.Double();road.moveTo(8,50);road.quadTo(31,44,55,50);g.draw(road);g.dispose();ImageIO.write(image,"png",Paths.get("web/assets/icon-"+size+".png").toFile());System.out.println("Exported El Oeste icon "+size);
 }}
}
