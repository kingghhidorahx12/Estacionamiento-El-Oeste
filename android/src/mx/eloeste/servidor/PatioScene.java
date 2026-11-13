package mx.eloeste.servidor;

import android.content.Context;
import android.graphics.*;
import android.view.View;

/** Original EO facade artwork; decorative, never placed behind financial data. */
final class PatioScene extends View {
    private final Paint p=new Paint(Paint.ANTI_ALIAS_FLAG);
    PatioScene(Context context){super(context);setImportantForAccessibility(IMPORTANT_FOR_ACCESSIBILITY_NO);}
    private void rect(Canvas c,float l,float t,float r,float b,int color){p.setColor(color);c.drawRect(l,t,r,b,p);}
    @Override protected void onDraw(Canvas canvas){super.onDraw(canvas);canvas.save();canvas.translate((getWidth()-getHeight()*4f)/2,0);canvas.scale(getHeight()/80f,getHeight()/80f);
        p.setColor(0x159a815d);canvas.drawOval(8,67,312,78,p);
        p.setShader(new LinearGradient(95,16,225,70,0xfffff5d9,0xffd8bd94,Shader.TileMode.CLAMP));canvas.drawRect(94,24,225,66,p);p.setShader(null);
        rect(canvas,88,20,231,28,0xffa07949);rect(canvas,123,10,196,22,0xffa07949);rect(canvas,122,15,197,31,0xfffff6df);
        p.setColor(0xff305955);p.setTextSize(13);p.setTypeface(Typeface.create("serif",Typeface.BOLD));p.setTextAlign(Paint.Align.CENTER);canvas.drawText("EO",160,28,p);
        rect(canvas,123,37,196,66,0xff2a4c49);rect(canvas,131,43,188,66,0xff203f40);
        p.setColor(0xff447d75);canvas.drawRoundRect(29,53,110,70,5,5,p);canvas.drawRoundRect(43,41,91,60,6,6,p);rect(canvas,49,45,85,54,0xffdce9d7);
        p.setColor(0xffc9a16a);canvas.drawRoundRect(211,54,292,70,5,5,p);canvas.drawRoundRect(225,43,273,61,6,6,p);rect(canvas,231,47,267,55,0xfff5edcf);
        for(int x:new int[]{44,94,226,276}){p.setColor(0xff354b45);canvas.drawCircle(x,69,6,p);p.setColor(0xffdce1cc);canvas.drawCircle(x,69,2.5f,p);}
        rect(canvas,237,30,252,47,0xff3f6862);rect(canvas,243,47,246,66,0xff9a8e70);p.setTextSize(12);p.setColor(0xfffff5d9);canvas.drawText("P",244,43,p);canvas.restore();
    }
}
