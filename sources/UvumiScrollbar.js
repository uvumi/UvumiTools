/*
UvumiTools Scrollbar v1.1.0 http://uvumi.com/tools/

Copyright (c) 2008 Uvumi LLC

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
*/

var UvumiScrollbar = new Class({
	Implements : Options,
	
	options:{
		baseClass:'scrollBar'
	},
	
	initialize:function(el,options){
		this.el = el;
		this.setOptions(options);
		if(Browser.Engine.webkit){
			window.addEvent('domready',this.domReady.delay(100,this));
		}else{
			window.addEvent('domready',this.domReady.bind(this));
		}
	},
	
	domReady:function(){
		this.el = $(this.el);
		//build the scrollbars
		this.build();
		//update them to match the existing content
		this.update();
		//this add the click/drag mode when you highlight text in every browser except IE
		if(!Browser.Engine.trident){
			this.el.addEvent('mousedown',function(e){
				e.stopPropagation();
				if(this.vscroll){
					this.vscroll.drag.start(e);
				}
				if(this.hscroll){
					this.hscroll.drag.start(e);
				}
			}.bind(this));
		}
		//if you are scrolling and release the mouse button while the pointer is outside the document, the mouse up event is not fired. So we simply stop scrolling as soon the mouse leaves the screen
		$$('body').addEvents({
			'mouseup':this.stopScrolling.bind(this)
		});
	},
	
	build:function(){
		this.el.setStyle('overflow','hidden');
		//we retrieve the original style from the element, to transfer it to the wrapper
		this.paddingBottom = this.el.getStyle('paddingBottom').toInt();
		this.paddingTop = this.el.getStyle('paddingTop').toInt();
		this.paddingRight = this.el.getStyle('paddingRight').toInt();
		this.border = this.el.getStyle('borderWidth').toInt();
		var styles = this.el.getStyles('borderWidth','borderColor','borderStyle','position','overflow');
		this.el.setStyles({
			border:0
		});
		this.dimensions = this.el.getSize();
		styles.position = (styles.position=="static"?"relative":styles.position);
		styles.width=this.dimensions.x;
		styles.height=this.dimensions.y;
		
		
		this.wrapper=new Element('div',{
			'class':this.options.baseClass,
			styles:styles
		}).wraps(this.el);

		this.el.setStyles({
			position:'relative',
			margin:0,
			top:0,
			left:0,
			width:"auto",
			height:this.dimensions.y-this.border
		});
		
		//building the scrollbars
		this.scrollbarVertical = new Element('div',{
			'class':'bar',
			styles:{
				position:'absolute',
				padding:0,
				margin:0,
				top:0,
				right:0,
				visibility:'hidden'
			}
		});	
		this.buttonTop = new Element('div',{
			'class':'button topButton',
			styles:{
				position:'relative'
			},
			events:{
				mousedown:this.startScrollingVertically.bindWithEvent(this,true)
			}
		}).inject(this.scrollbarVertical);
		this.verticalScrollable = new Element('div',{
			'class':'scrollable',
			styles:{
				position:'relative',
				overflow:'hidden'
			}
		}).inject(this.scrollbarVertical);
		this.buttonBottom = new Element('div',{
			'class':'button bottomButton',
			styles:{
				position:'relative'
			},
			events:{
				mousedown:this.startScrollingVertically.bind(this)
			}
		}).inject(this.scrollbarVertical);
		this.verticalKnob = new Element('div',{
			'class':'knob verticalKnob',
			styles:{
				position:'absolute',
				top:0,
				left:0
			}
		}).inject(this.verticalScrollable);
		
		if(Browser.Engine.trident4){
			this.verticalKnob.set('id','verticalKnob');
		}
		
		this.vKnobTop = new Element('div',{
			'class':'knobVerticalTip topTip',
			styles:{
				width:'100%'
			}
		}).inject(this.verticalKnob);
		
		this.vKnobFill = new Element('div',{
			'class':'knobVerticalFill',
			styles:{
				width:'100%'
			}
		}).inject(this.verticalKnob);
		
		this.vKnobBottom = new Element('div',{
			'class':'knobVerticalTip bottomTip',
			styles:{
				width:'100%'
			}
		}).inject(this.verticalKnob);
		

		
		
		this.scrollbarHorizontal = new Element('div',{
			'class':'bar',
			styles:{
				width:'100%',
				position:'absolute',
				padding:0,
				margin:0,
				left:0,
				bottom:0,
				visibility:'hidden'
			}
		});
		
		this.buttonLeft = new Element('div',{
			'class':'button leftButton',
			styles:{
				position:'relative',
				'float':'left'
			},
			events:{
				mousedown:this.startScrollingHorizontally.bindWithEvent(this,true)
			}
		}).inject(this.scrollbarHorizontal);
		
		this.horizontalScrollable = new Element('div',{
			'class':'scrollable',
			styles:{
				position:'relative',
				overflow:'hidden',
				'float':'left'
			}
		}).inject(this.scrollbarHorizontal);
		
		this.buttonRight = new Element('div',{
			'class':'button rightButton',
			styles:{
				position:'relative',
				'float':'left'
			},
			events:{
				mousedown:this.startScrollingHorizontally.bind(this)
			}
		}).inject(this.scrollbarHorizontal);
		
		this.horizontalKnob = new Element('div',{
			'class':'knob horizontalKnob',
			styles:{
				position:'absolute',
				top:0,
				left:0
			}
		}).inject(this.horizontalScrollable);
		
		this.hKnobLeft = new Element('div',{
			'class':'knobHorizontalTip leftTip',
			styles:{
				height:'100%'
			}
		}).inject(this.horizontalKnob);
		
		this.hKnobRight = new Element('div',{
			'class':'knobHorizontalTip rightTip',
			styles:{
				height:'100%'
			}
		}).inject(this.horizontalKnob);
		
		this.hKnobFill = new Element('div',{
			'class':'knobHorizontalFill',
			styles:{
				height:'100%'
			}
		}).inject(this.horizontalKnob);
		
		var clear = new Element('div',{
			styles:{
				height:0,
				width:0,
				clear:'left'
			}
		}).inject(this.scrollbarHorizontal);
		
		this.corner = new Element('div',{
			'class':'corner',
			styles:{
				position:'absolute',
				bottom:0,
				right:0,
				display:'none'
			}
		});
		
		$$(this.buttonTop,this.buttonBottom,this.buttonLeft,this.buttonRight,this.horizontalKnob,this.horizontalScrollable,this.verticalScrollable,this.verticalKnob,this.corner,clear).setStyles({
			lineHeight:0,
			fontSize:0
		});
		
		//everything is injected inside the wrapper, which will replace the original element
		this.scrollbarVertical.inject(this.wrapper);
		this.width = this.scrollbarVertical.getSize().x;
		this.scrollbarVertical.setStyles({
			display:'none',
			visibility:''
		});

		this.scrollbarHorizontal.inject(this.wrapper);
		this.height = this.scrollbarHorizontal.getSize().y;
		this.scrollbarHorizontal.setStyles({
			display:'none',
			visibility:''
		});
		
		this.el.setStyles({
			marginRight:this.width,
			height:this.dimensions.y-this.height-this.border-this.paddingBottom,
			width:(Browser.Engine.trident4?this.dimensions.x-this.width-this.border:"auto")
		});

		this.corner.inject(this.wrapper).setStyles({
			width:this.width-2*this.corner.getStyle('borderWidth').toInt(),
			height:this.height-2*this.corner.getStyle('borderWidth').toInt()
		});
		
		//create a a copy of mouse wheel function with bind parameter so it can be easily attached and removed from the mousewheel event
		this.mouseEvent = this.mouseWheel.bind(this);
	},
	
	//this messy function is the one that set the size of scrollers and detect which scroll bar should be displayed or not
	update:function(){
		$$(this.verticalScrollable,this.verticalKnob,this.horizontalScrollable, this.horizontalKnob).removeEvents();
		this.scrollSize = this.el.getScrollSize();
		if(this.scrollSize.y>this.dimensions.y){
			if(this.scrollbarVertical.getStyle('display')!='block'){
				this.wrapper.addEvent('mousewheel',this.mouseEvent);
				this.scrollbarVertical.setStyle('display','block');
			}
			this.scrollHeight = this.dimensions.y-(this.scrollSize.x>this.dimensions.x?3:2)*(this.height+this.scrollbarVertical.getStyle('border-width').toInt());
			this.verticalScrollable.setStyle('height',this.scrollHeight);	
			this.el.setStyle('margin-right',this.width);
			var knobSize = Math.max((this.dimensions.y*this.scrollHeight/this.scrollSize.y).toInt(),this.height);
			this.verticalKnob.setStyle('height',knobSize);
			this.vscroll=new Slider(this.verticalScrollable, this.verticalKnob,{
				mode:'vertical',
				range:[0,this.scrollSize.y-this.dimensions.y+this.height+this.paddingBottom+this.paddingTop],
				steps:this.scrollSize.y-this.dimensions.y+this.height+this.paddingBottom+this.paddingTop,
				onChange:this.scrollToVerticalPosition.bind(this),
				onTick:this.tick
			}).set(this.el.getScroll().y).fireEvent('onComplete');
		}else if(this.scrollbarVertical.getStyle('display')!='none'){
			this.scrollbarVertical.setStyle('display','none');	
			this.el.setStyle('margin-right',0);
			this.wrapper.removeEvent('mousewheel',this.mouseEvent);
			this.el.scrollTo(this.el.getScroll().x,0);
		}
		
		if(this.scrollSize.x>this.dimensions.x){
			if(this.scrollbarHorizontal.getStyle('display')!='block'){
				this.scrollbarHorizontal.setStyle('display','block');
			}	
			this.scrollWidth = this.dimensions.x-(this.scrollSize.y>this.dimensions.y?3:2)*(this.width+this.scrollbarHorizontal.getStyle('border-width').toInt());
			this.horizontalScrollable.setStyle('width',this.scrollWidth);
			this.el.setStyle('height',this.dimensions.y-this.height-this.paddingBottom-this.paddingTop);
			var knobSize = Math.max((this.dimensions.x*this.scrollWidth/this.scrollSize.x).toInt(),this.width);
			this.horizontalKnob.setStyle('width',knobSize);
			this.hscroll=new Slider(this.horizontalScrollable, this.horizontalKnob,{
				mode:'horizontal',
				range:[0,this.scrollSize.x+this.width-this.dimensions.x+this.paddingRight],
				steps:this.scrollSize.x+this.width-this.dimensions.x+this.paddingRight,
				onChange:this.scrollToHorizontalPosition.bind(this),
				onTick:this.tick
			}).set(this.el.getScroll().x);
		}else if(this.scrollbarHorizontal.getStyle('display')!='none'){
			this.scrollbarHorizontal.setStyle('display','none');
			this.el.setStyle('height',this.dimensions.y-this.paddingBottom-this.paddingTop);
			this.el.scrollTo(0,this.el.getScroll().y);
		}
		
		if(this.scrollSize.y>this.dimensions.y && this.scrollSize.x>this.dimensions.x){
			this.corner.setStyle('display','block');
		}else{
			this.corner.setStyle('display','none');
		}
		this.stopScrolling();		
	},

	//horizontal scrolling function, called by horizontal slider
	scrollToHorizontalPosition:function(step){
		this.el.scrollTo(step,this.el.getScroll().y);
	},
	
	//vertical scrolling function, called by vertical slider
	scrollToVerticalPosition:function(step){
		this.el.scrollTo(this.el.getScroll().x,step);
	},
	
	//vertical scrolling function called by top and bottom buttons
	startScrollingVertically:function(e,top){
		e.stop();
		$clear(this.periodScroll);
		if(top){
			this.buttonTop.addClass('active');
			this.periodScroll =  this.scrollVertical.periodical(20,this,-5);
		}else{
			this.buttonBottom.addClass('active');
			this.periodScroll =  this.scrollVertical.periodical(20,this,5);
		}
	},
	
	//horizontal scrolling function called by left and right buttons
	startScrollingHorizontally:function(e,left){
		e.stop();
		$clear(this.periodScroll);
		if(left){
			this.buttonLeft.addClass('active');
			this.periodScroll =  this.scrollHorizontal.periodical(20,this,-5);
		}else{
			this.buttonRight.addClass('active');
			this.periodScroll =  this.scrollHorizontal.periodical(20,this,5);
		}
	},
	
	//stop scrolling, stop the periodical scroll set by vertical and horizontal scrolling functions
	stopScrolling:function(){
		$$(this.buttonBottom,this.buttonTop,this.buttonLeft,this.buttonRight,this.verticalKnob,this.horizontalKnob).removeClass('active');
		$clear(this.periodScroll);
	},

	//increase vertical scroll position, called periodically by vertical scrolling function
	scrollVertical:function(distance){
		this.vscroll.set(this.vscroll.step+distance);
	},

	//increase horizontal scroll position, called periodically horizontal scrolling function
	scrollHorizontal:function(distance){
		this.hscroll.set(this.hscroll.step+distance);
	},
	
	//scroll vertically depending of mouse whell direction
	mouseWheel:function(e){
		e.stop();
		this.scrollVertical(e.wheel<=0?20:-20);
		this.verticalKnob.removeClass('active')
	},
	
	//scroll to clicked position on scrollbar. 'this' refers to the slider object the function is attached to
	tick:function(pos){
		this.knob.setStyle(this.property, pos);
	}
});


Slider.implement({
	clickedElement: function(event){
		this.knob.addClass('active');
		if($(event.target) == this.element){
			var dir = this.range < 0 ? -1 : 1;
			var position = event.page[this.axis] - this.element.getPosition()[this.axis] - this.half;
			position = position.limit(-this.options.offset, this.full -this.options.offset);
			this.step = Math.round(this.min + dir * this.toStep(position));
			this.checkStep();
			this.end();
			this.fireEvent('tick', position);
		}
	}
});