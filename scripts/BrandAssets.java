import java.awt.*;
import java.awt.font.*;
import java.awt.geom.*;
import java.awt.image.BufferedImage;
import java.nio.file.*;
import java.util.*;
import javax.imageio.ImageIO;

/** Original commercial sign, composed from OFL type outlines and architectural geometry. */
public final class BrandAssets {
    record Part(String path,String color) {}
    static final String INK="#192F36",PAPER="#FFF9EB",BRASS="#B18A49";
    static Font rye;
    static String path(Shape shape) {
        StringBuilder result=new StringBuilder();double[] c=new double[6];
        for(PathIterator it=shape.getPathIterator(null);!it.isDone();it.next()) {
            int type=it.currentSegment(c);String command=new String[]{"M","L","Q","C","Z"}[type];result.append(command);
            int length=new int[]{2,2,4,6,0}[type];for(int i=0;i<length;i++)result.append(String.format(Locale.ROOT,"%.2f",c[i])).append(i%2==0?',':' ');
        }return result.toString();
    }
    static Shape textShape(String text,double x,double y,double width,double height) {
        GlyphVector glyph=rye.deriveFont(100f).createGlyphVector(new FontRenderContext(null,true,true),text);
        Shape outline=glyph.getOutline();Rectangle2D bounds=outline.getBounds2D();
        AffineTransform transform=new AffineTransform();transform.translate(x,y);transform.scale(width/bounds.getWidth(),height/bounds.getHeight());transform.translate(-bounds.getX(),-bounds.getY());return transform.createTransformedShape(outline);
    }
    static String lettering(String text,double x,double y,double width,double height){return path(textShape(text,x,y,width,height));}
    static java.util.List<Part> mark(String ink,String paper,String accent) {
        return java.util.List.of(new Part("M16,46 L42,46 L42,28 L78,28 Q128,-5 178,28 L214,28 L214,46 L240,46 L240,64 L230,64 L230,216 L26,216 L26,64 L16,64 Z",ink),new Part("M34,70 L222,70 L222,207 L34,207 Z",paper),new Part("M49,82 L207,82 L207,86 L49,86 Z M49,190 L207,190 L207,194 L49,194 Z",accent),new Part(lettering("EO",51,101,154,72),ink));
    }
    static void svg(Path target,int width,int height,java.util.List<Part> parts,String label)throws Exception {
        StringBuilder out=new StringBuilder("<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 "+width+" "+height+"\" role=\"img\" aria-label=\""+label+"\">");
        for(Part p:parts)out.append("<path fill=\"").append(p.color()).append("\" d=\"").append(p.path()).append("\"/>");
        Files.writeString(target,out.append("</svg>\n").toString());
    }
    static void png(Path target,int size)throws Exception {
        BufferedImage img=new BufferedImage(size,size,BufferedImage.TYPE_INT_ARGB);Graphics2D g=img.createGraphics();g.setRenderingHint(RenderingHints.KEY_ANTIALIASING,RenderingHints.VALUE_ANTIALIAS_ON);g.setColor(Color.decode(PAPER));g.fillRect(0,0,size,size);g.scale(size/256.0,size/256.0);
        // Native rendering shares the same geometries and glyph outlines.
        Path2D sign=new Path2D.Double();sign.moveTo(16,46);sign.lineTo(42,46);sign.lineTo(42,28);sign.lineTo(78,28);sign.quadTo(128,-5,178,28);sign.lineTo(214,28);sign.lineTo(214,46);sign.lineTo(240,46);sign.lineTo(240,64);sign.lineTo(230,64);sign.lineTo(230,216);sign.lineTo(26,216);sign.lineTo(26,64);sign.lineTo(16,64);sign.closePath();g.setColor(Color.decode(INK));g.fill(sign);g.setColor(Color.decode(PAPER));g.fillRect(34,70,188,137);g.setColor(Color.decode(BRASS));g.fillRect(49,82,158,4);g.fillRect(49,190,158,4);
        GlyphVector glyph=rye.deriveFont(100f).createGlyphVector(g.getFontRenderContext(),"EO");Shape outline=glyph.getOutline();Rectangle2D bounds=outline.getBounds2D();AffineTransform t=new AffineTransform();t.translate(51,101);t.scale(154/bounds.getWidth(),72/bounds.getHeight());t.translate(-bounds.getX(),-bounds.getY());g.setColor(Color.decode(INK));g.fill(t.createTransformedShape(outline));g.dispose();ImageIO.write(img,"png",target.toFile());
    }
    public static void main(String[] args)throws Exception {
        Path assets=Path.of("web/assets");rye=Font.createFont(Font.TRUETYPE_FONT,assets.resolve("fonts/Rye-Regular.ttf").toFile());
        svg(assets.resolve("mark.svg"),256,256,mark(INK,PAPER,BRASS),"El Oeste · fachada comercial");svg(Path.of("web/icon.svg"),256,256,mark(INK,PAPER,BRASS),"El Oeste");
        svg(assets.resolve("mark-dark.svg"),256,256,mark(PAPER,INK,BRASS),"El Oeste");svg(assets.resolve("mark-mono.svg"),256,256,mark("#000000","#FFFFFF","#000000"),"El Oeste");
        var horizontal=new ArrayList<Part>();horizontal.add(new Part("M8,32 L28,32 L28,18 L60,18 Q100,-6 140,18 L172,18 L172,32 L192,32 L192,48 L184,48 L184,176 L16,176 L16,48 L8,48 Z",INK));horizontal.add(new Part(lettering("EO",36,66,128,65),PAPER));horizontal.add(new Part(lettering("EL OESTE",225,42,515,72),INK));horizontal.add(new Part("M225,133 L740,133 L740,137 L225,137 Z",BRASS));horizontal.add(new Part(lettering("ESTACIONAMIENTO",247,150,470,23),INK));svg(assets.resolve("logo-horizontal.svg"),770,200,horizontal,"El Oeste · Estacionamiento");
        for(int size:new int[]{180,192,512})png(assets.resolve("icon-"+size+".png"),size);
        BufferedImage horizontalPng=new BufferedImage(2310,600,BufferedImage.TYPE_INT_ARGB);Graphics2D g=horizontalPng.createGraphics();g.setRenderingHint(RenderingHints.KEY_ANTIALIASING,RenderingHints.VALUE_ANTIALIAS_ON);g.scale(3,3);g.drawImage(ImageIO.read(assets.resolve("icon-512.png").toFile()),0,0,200,200,null);g.setColor(Color.decode(INK));g.fill(textShape("EL OESTE",225,42,515,72));g.fill(textShape("ESTACIONAMIENTO",247,150,470,23));g.setColor(Color.decode(BRASS));g.fillRect(225,133,515,4);g.dispose();ImageIO.write(horizontalPng,"png",assets.resolve("logo-horizontal.png").toFile());
        StringBuilder nativeIcon=new StringBuilder("<vector xmlns:android=\"http://schemas.android.com/apk/res/android\" android:width=\"108dp\" android:height=\"108dp\" android:viewportWidth=\"256\" android:viewportHeight=\"256\"><path android:fillColor=\""+PAPER+"\" android:pathData=\"M0,0H256V256H0Z\"/>");
        for(Part part:mark(INK,PAPER,BRASS))nativeIcon.append("<path android:fillColor=\"").append(part.color()).append("\" android:pathData=\"").append(part.path()).append("\"/>");
        Files.writeString(Path.of("android/res/drawable/oeste_icon.xml"),nativeIcon.append("</vector>\n").toString());
        Files.copy(assets.resolve("mark.svg"),Path.of("remote/public/assets/mark.svg"),StandardCopyOption.REPLACE_EXISTING);
        System.out.println("PASS: coherent SVG, PNG and native vector sign assets.");
    }
}
