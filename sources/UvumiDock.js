/*
UvumiTools Dock Menu v1.1 http://uvumi.com/tools/dock.html

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

var UvumiDock = new Class({

	Implements:Options,
	
	options:{
		position:'bottom', //default positinon. Can be 'top' or 'bottom' of the screen
		captionClassName:'dock-caption', // the small foating text above the icones get a css class to be styled. The text itself is grab from the <img/> 's alt attribute
		minHeight:64, //Size of the icones when not hovered, should be half of the max size
		maxHeight:128, // size of the icones when hovered. For better result the image itself should have this height
		hide:true, // if the dock should hide when not focused
		dockClassName:'dock-menu',//ccs class given to the ewrapper element for eventual styling (background image)
		openDuration:500,//time for opening, if hide option is true
		hiddenOpacity:0.5,//opacity of dock when hidden, if enabled
		IEfixer:"css/blank.gif" //file necessary to avoid bug in IE . Make sure this file is where this path says it is
	},

	initialize:function(container,options){
		this.el = container;
		this.setOptions(options);
		this.margin=(this.options.minHeight/2).toInt();
		window.addEvents({
			'domready':this.domReady.bind(this),
			'resize':this.updateSize.bind(this)
		});
	},
	
	domReady:function(){
		this.el = $(this.el);
		
		//check if we're dealing with a ul element
		if(this.el.get('tag')!='ul'){
			window.removeEvents('resize');
			return false;
		}
		
		//change ul display from block to inline
		this.el.setStyles({
			display:'inline',
			textAlign:'center'
		});
		
		//change li display from list to inline
		this.lis = $$(this.el.getElements('li'));
		this.lis.setStyles({
			display:'inline',
			listStyle:'none'
		});
		
		this.images = $$(this.el.getElements('img'));
		
		this.images.setStyles({
			border:0,
			height:this.options.minHeight
		});		
		
		//generate caption for each image from its alt property
		this.captions = [];
		this.images.each(function(image){
			var caption = new Element('span',{
				html:image.getProperty('alt'),
				'class':this.options.captionClassName,
				styles:{
					position:'absolute',
					top:-10,
					left:0,
					opacity:0
				},
				tween:{
					link:'cancel'
				}
			}).inject(image.getParent('li'));
			image.store('caption',caption);
			this.captions.push(caption);
		},this);
		
		//display/hide caption when mouse hovers the icones
		this.images.addEvents({
			mouseenter:this.showCaption,
			mouseleave:this.hideCaption
		});

		//the dock will contain the ul
		this.dock = new Element('div',{
			'class':this.options.dockClassName,
			styles:{
				textAlign:'center',
				opacity:(this.options.hide?this.options.hiddenOpacity:1)
			},
			events:{
				mousemove:this.fishEye.bind(this),
				mouseleave:this.close.bind(this)
			}
		});
		
		//if hide is true we add an extra event to mouseneter to unhide the dock.
		if(this.options.hide){
			this.dock.addEvent('mouseenter',this.open.bind(this));
		}
		
		this.animFx = new Fx.Elements($$(this.dock,this.images),{
			duration:this.options.openDuration,
			link:'cancel'
		});

		//the big IE6 hack. We create an element that will wraps everything in the document (yes everything) except the the dock
		//this way, when you'll scroll, in this wrapper it will give the illusion you're scrolling the whole document while you'll be scrolling a div only
		//In the meantime, the dock is position absolutly, not fixed, outside this wrapper, in the document body, which never scrolls. It will look like it's fixed.
		//you must be aware this if you generate any new element positioned absolutely, il must be injected in the wrapper and not the document body (in IE6 only), or this new element will look fixed
		//That's why this plugin might conflict with other plugins that generate new elements.
		if(Browser.Engine.trident){
			var body = $$('body')[0];
			if(Browser.Engine.trident4){
				//we duplicate the body style. This includes margin, padding and background,
				var bodyStyle = body.getStyles('padding','margin','backgroundColor','backgroundImage','backgroundRepeat');
				var backPosX = body.currentStyle.backgroundPositionX; //only way to get background position if it's set with CSS
				var backPosY = body.currentStyle.backgroundPositionY; //only way to get background position if it's set with CSS
				body.setStyles({
					overflow:'hidden',
					margin:0,
					padding:0,
					height:'100%'
				});
				var padding = bodyStyle.padding.split(" ");
				var margin = bodyStyle.margin.split(" ");
				wrapperStyle = {
					paddingLeft: padding[3].toInt()+margin[3].toInt(),
					paddingRight: padding[1].toInt()+margin[1].toInt(),
					background:bodyStyle.backgroundColor+" "+bodyStyle.backgroundImage+" "+bodyStyle.backgroundRepeat+" "+backPosY+" "+backPosX,
					position:'relative',
					height:'100%',
					overflow:'auto'
				};
				var children = body.getChildren();
				var wrapper = new Element('div',{
					styles:wrapperStyle
				}).adopt(children).inject(body);
				this.dock.inject(body).setStyle("position",'absolute').adopt(this.el);
			}else{
				this.dock.setStyle('position','fixed');
			}
			//We also fix PNG transparency
			this.dock.inject(body).setStyle('backgroundImage','url('+this.options.IEfixer+')').adopt(this.el);
			this.images.each(function(image){
				image.setStyle('filter','progid:DXImageTransform.Microsoft.AlphaImageLoader(src=\''+image.getProperty("src")+'\', sizingMethod=\'scale\')');
				image.setProperty("src",this.options.IEfixer);
			},this);
		}else{
			this.dock.inject(document.body).setStyle('position','fixed').adopt(this.el);
		}
		
		this.size = this.dock.getSize();
		this.updatePosition();
	},
	
	//open the dock when hovered.
	open:function(){
		var anim = {0:{
			opacity:1
		}};
		anim[0][this.animationParam]=0;
		this.animFx.start(anim);
	},
	
	//close the dock on mouseleave
	close:function(){
		var anim={}; 
		if(this.options.hide){
			anim[0]={
				opacity:this.options.hiddenOpacity
			};
			anim[0][this.animationParam]=-this.size.y+this.margin;
		}
		for(var i=1;i<=this.images.length;i++){
			anim[i]={height:this.options.minHeight};
		}
		this.animFx.start(anim);
	},
	
	//you can dynamically change the dock position. Just set myDock.options,position to top or bottom, and call this function
	updatePosition:function(){
		switch(this.options.position){
			case 'top':
				var coords={
					top:(this.options.hide?-this.size.y+this.margin:0),
					left:0,
					width:'100%'
				};
				this.animationParam = 'top';
				if(!Browser.Engine.gecko){
					this.lis.setStyle('verticalAlign','top');
				}
				$$(this.captions).setStyles({
					top:"",
					bottom:-10
				});
			break;
			case 'bottom':
				var coords={
					bottom:(this.options.hide?-this.size.y+this.margin:0),
					left:0,
					width:'100%'
				};
				this.animationParam = 'bottom';
				$$(this.captions).setStyles({
					top:-10,
					bottom:""
				});
			break;
		}
		this.dock.setStyles(coords);
	},
	
	//function called when window is resized
	updateSize:function(){
		this.size = this.dock.getSize();
		this.el.fireEvent('mouseleave');
	},
	
	//the most important function, called on mousemove over the dock.
	fishEye:function(e){
		this.images.each(function(image){
			cos = (image.getPosition().x+image.getSize().x/2 - e.client.x)/this.options.maxHeight;
			cos = Math.max(Math.min(cos,Math.PI/2),-Math.PI/2);
			image.setStyle('height',(Math.max((this.options.maxHeight*Math.cos(cos)),this.options.minHeight)).toInt());
			image.retrieve('caption').setStyle('left',e.client.x-15);
		},this);
		
	},
	
	//show caption over an image. 'this' do not refer to the dock object but to the image being hovered
	showCaption:function(){
		this.retrieve('caption').get('tween').start('opacity',1);
	},
	
	//hide caption when leaving an image. 'this' do not refer to the dock object but to the image left
	hideCaption:function(){
		this.retrieve('caption').get('tween').start('opacity',0);
	}
});

//temporary fix for opera until the mootools is fixed
Element.implement({
	getPosition: function(relative){
		if (isBody(this)) return {x: 0, y: 0};
		var offset = this.getOffsets(), scroll = this.getScrolls();
		var position = {x: offset.x - scroll.x, y: offset.y - scroll.y};
		var relativePosition = (relative && (relative = $(relative))) ? relative.getPosition() : {x: 0, y: 0};
        if (Browser.Engine.presto925) {
            var position = {x: offset.x, y: offset.y};
        }
		return {x: position.x - relativePosition.x, y: position.y - relativePosition.y};
	}
});

function isBody(element){
	return (/^(?:body|html)$/i).test(element.tagName);
};