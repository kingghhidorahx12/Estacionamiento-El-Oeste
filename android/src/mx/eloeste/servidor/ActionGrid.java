package mx.eloeste.servidor;

import android.content.Context;
import android.view.*;
import java.util.ArrayList;

/** Equal touch targets and a centered final row, including hidden update actions. */
final class ActionGrid extends ViewGroup {
    private final ArrayList<View> visible=new ArrayList<>();
    private int columns,slot,gap;
    ActionGrid(Context context){super(context);gap=Math.round(8*getResources().getDisplayMetrics().density);}
    @Override protected void onMeasure(int widthSpec,int heightSpec){
        visible.clear();for(int i=0;i<getChildCount();i++)if(getChildAt(i).getVisibility()!=GONE)visible.add(getChildAt(i));
        int width=MeasureSpec.getSize(widthSpec);columns=Math.min(Math.max(1,visible.size()),getResources().getConfiguration().screenWidthDp>=840?3:2);slot=Math.max(0,(width-gap*(columns-1))/columns);
        int height=0,rowHeight=0;
        for(int i=0;i<visible.size();i++){View child=visible.get(i);child.measure(MeasureSpec.makeMeasureSpec(slot,MeasureSpec.EXACTLY),MeasureSpec.makeMeasureSpec(0,MeasureSpec.UNSPECIFIED));rowHeight=Math.max(rowHeight,child.getMeasuredHeight());if(i%columns==columns-1||i==visible.size()-1){height+=rowHeight+(i==visible.size()-1?0:gap);rowHeight=0;}}
        setMeasuredDimension(width,resolveSize(height,heightSpec));
    }
    @Override protected void onLayout(boolean changed,int l,int t,int r,int b){
        int y=0;for(int first=0;first<visible.size();first+=columns){int count=Math.min(columns,visible.size()-first),height=0;for(int j=0;j<count;j++)height=Math.max(height,visible.get(first+j).getMeasuredHeight());int x=(getWidth()-(count*slot+(count-1)*gap))/2;for(int j=0;j<count;j++){View child=visible.get(first+j);child.layout(x,y,x+slot,y+height);x+=slot+gap;}y+=height+gap;}
    }
}
