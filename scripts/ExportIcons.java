import java.awt.*;
import java.awt.geom.*;
import java.awt.image.BufferedImage;
import java.nio.file.*;
import javax.imageio.ImageIO;

/** Platform raster exports of the El Oeste sunset and westward arrow mark. */
public final class ExportIcons {
 public static void main(String[] args)throws Exception { for(int size:new int[]{180,192,512}) {
  BufferedImage image=new BufferedImage(size,size,BufferedImage.TYPE_INT_RGB);Graphics2D g=image.createGraphics();g.setRenderingHint(RenderingHints.KEY_ANTIALIASING,RenderingHints.VALUE_ANTIALIAS_ON);g.scale(size/64.0,size/64.0);
  g.setPaint(new GradientPaint(0,0,new Color(0x1c4766),64,64,new Color(0x102d48)));g.fillRect(0,0,64,64);g.translate(5,3);g.scale(.84,.84);
  g.setColor(new Color(0xf7ead0));g.setStroke(new BasicStroke(2.6f,BasicStroke.CAP_ROUND,BasicStroke.JOIN_ROUND));g.draw(new Arc2D.Double(8,6,48,48,-15,210,Arc2D.OPEN));
  g.setColor(new Color(0xe6b052));g.fill(new Arc2D.Double(22,25,20,20,0,180,Arc2D.CHORD));g.setStroke(new BasicStroke(1.8f,BasicStroke.CAP_ROUND,BasicStroke.JOIN_ROUND));g.draw(new Line2D.Double(32,16,32,20));g.draw(new Line2D.Double(18,23,21,26));g.draw(new Line2D.Double(46,23,43,26));
  g.setColor(new Color(0xf7ead0));g.setStroke(new BasicStroke(2.4f,BasicStroke.CAP_ROUND,BasicStroke.JOIN_ROUND));g.draw(new Line2D.Double(11,38,53,38));
  g.setColor(new Color(0xe6b052));g.setStroke(new BasicStroke(2.7f,BasicStroke.CAP_ROUND,BasicStroke.JOIN_ROUND));Path2D arrow=new Path2D.Double();arrow.moveTo(23,44);arrow.lineTo(15,49);arrow.lineTo(23,54);g.draw(arrow);g.draw(new Line2D.Double(16,49,48,49));
  g.setColor(new Color(0xf7ead0));g.setStroke(new BasicStroke(1.7f,BasicStroke.CAP_ROUND,BasicStroke.JOIN_ROUND));g.draw(new Line2D.Double(29,57,42,57));g.dispose();ImageIO.write(image,"png",Paths.get("web/assets/icon-"+size+".png").toFile());
 } }
}
