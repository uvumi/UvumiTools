/*
UvumiTools Odometer v1.0 http://tools.uvumi.com/odometer.html

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

var UvumiOdometer = new Class({

	Implements:[Options,Events],
	
	options:{
		counterClass:'odometer',
		digits:6,
		image:'css/odometer.gif',
		overlay:'css/overlay.png',
		startDuration:1200,
		cruiseDuration:100,
		transition:'linear',
		onComplete:$empty,
		url:false,
		refreshRate:10,
		indicatorClass:'loading'
	},

	initialize:function(container,options){
		this.counter = container;
		this.setOptions(options);
		window.addEvent('domready',this.domReady.bind(this));
	},
	
	domReady:function(){
		this.counter = $(this.counter);
		this.image = new Asset.image(this.options.image,{
			onload:this.build.bind(this)
		});
	},
	
	build:function(){
		this.fullHeight = this.image.height;
		this.height = (this.fullHeight/10).toInt();
		this.width = this.image.width;
		var value = this.counter.get('html').clean().toInt();
		if(isNaN(value)){
			value=0;
		}
		this.counter.empty().setStyles({
			width:this.options.digits*this.width,
			height:this.height,
			overflow:'hidden',
			display:'block',
			position:(this.counter.getStyle('position')=='absolute'?'absolute':'relative')
		}).addClass(this.options.counterClass);
		this.counter.set('title','Double-click on counter to directly jump to final value');
		this.numbers = [];
		for(var i=0;i<this.options.digits;i++){
			var number = this.addNumber();
			number.inject(this.counter);
			this.numbers.push(number);
		}
		if(this.options.overlay){
			this.overlay = Element('div',{
				styles:{
					'position':'absolute',
					'top':0,
					'left':0,
					'width':'100%',
					'height':this.height,
					'font-size':0,
					'line-height':0,
					'background-image':'url('+this.options.overlay+')',
					'background-position':'left center'
				}
			}).inject(this.counter);
		}
		this.clear = new Element('br',{styles:{'clear':'right'}}).inject(this.counter);
		
		this.animation = new Fx.Elements(this.numbers,{
			link:'chain',
			duration:this.options.startDuration,
			transition:this.options.transition,
			onStart:function(){
				this.animating=true;		
				this.currentCount = this.currentCount + (this.direction?1:-1);
				if(this.step<=this.mid){
					this.animation.options.duration = (this.options.startDuration-(1-Math.exp(-this.step))*this.durationVariation).toInt();
					this.step++;
				}else{
					this.step++;
					this.animation.options.duration = (this.options.startDuration-(1-Math.exp(this.step-2*this.mid))*this.durationVariation).toInt();
				}
				
			}.bind(this),
			onChainComplete:function(){
				this.animating=false;
				this.fireEvent('onComplete',this.value);
				(function(){this.refreshed=false;}).delay(this.options.refreshRate*1000,this);
			}.bind(this)
		});
		this.durationVariation=this.options.startDuration - this.options.cruiseDuration;
		this.spins = [];
		this.setValue(value);

		if(this.options.url){
			if(this.options.indicatorClass){
				this.indicator=new Element('div',{
					'class':this.options.indicatorClass
				})
			}
			this.request = new Request({
				url:this.options.url,
				autoCancel:true,
				onComplete:function(response){
					var value = response.toInt();
					this.countTo(value);
					if(this.indicator){
						(function(){this.indicator.dispose()}).delay(1000,this);
					}
				}.bind(this)
			});
			this.refreshed=true;
			$(document.body).addEvent('mousemove',this.refresh.bind(this));
			(function(){this.refreshed=false;}).delay(this.options.refreshRate*1000,this);
		}
		
		this.counter.addEvent('dblclick',this.override.bind(this));
	},
	
	addNumber:function(){
		return number = new Element('div',{
			styles:{
				width:this.width,
				height:this.height,
				'font-size':0,
				'line-height':0,
				'float':'right',
				'background-image':'url('+this.options.image+')',
				'background-position':'bottom center'
			}
		});
	},
	
	setValue:function(value){
		if(isNaN(value)){
			return false;
		}
		value = value.toInt();
		if(value<0){
			value=0;
		}
		this.value = value;
		this.currentCount = value;
		this.convertNumber();
		for(var i=0;i<this.options.digits;i++){
			this.numbers[i].setStyle('background-position',this.getCoord(this.spins[i]));
		}
	},
	
	countTo:function(value){
		if(isNaN(value)){
			return false;
		}
		value = value.toInt();
		if(value<0){
			value=0;
		}
		if(value == this.value){
			return;
		}
		if(this.animating){
			this.animation.cancel();
			this.value = this.currentCount;
			this.convertNumber();
		}
		
		var steps = Math.abs(value-this.value);
		this.mid = steps/2;
		this.step=0;
		
		if(value>this.value){
			this.direction=true;
			for(var i=this.value+1;i<=value;i++){
				this.enqueueAnim(i);
			}
		}else{
			this.direction=false;
			for(var i=this.value-1;i>=value;i--){
				this.enqueueAnim(i);
			}
		}
	},
	
	convertNumber:function(){
		var val = this.value+"";
		if(val.length>this.options.digits){
			var number = this.addNumber();
			number.inject((this.overlay?this.overlay:this.clear),'before');
			this.numbers.push(number);
			this.options.digits++;
			this.counter.setStyle('width',this.options.digits*this.width);
			this.animation.elements = this.animation.subject = $$(this.numbers);
			number.setStyle('background-position',this.getCoord(0));
			this.convertNumber();
			return;
		}else{
			while(val.length<this.options.digits){
				val = "0"+val;
			}
			for(var i=0;i<val.length;i++){
				this.spins[i]=val.charAt(val.length-1-i);
			}
		}
	},
	
	getCoord:function(value){
		return '0px '+(this.height+value*this.height)+'px';
	},
	
	enqueueAnim:function(i){
		var anim = {};
		var previousSpin = $A(this.spins);
		this.value = i;
		this.convertNumber();
		this.spins.each(function(val,j){
			if(previousSpin[j]!=val){
				if(val==0 && this.direction){
					anim[j]={'background-position':[this.getCoord(-1),this.getCoord(0)]};
				}else if(val==9 && !this.direction){
					anim[j]={'background-position':[this.getCoord(10),this.getCoord(9)]};
				}else{
					anim[j]={'background-position':this.getCoord(val)};
				}
			}
		},this);
		this.animation.start(anim);
	},
	
	refresh:function(){
		if(!this.refreshed){
			this.refreshed=true;
			if(!this.animating){	
				this.request.send();
				if(this.indicator){
					var coords=this.counter.getCoordinates();
					this.indicator.setStyles({
						position:'absolute',
						top:coords.top,
						left:coords.right
					});
					this.indicator.inject(document.body);
				}
			}
		}
	},
	
	getValue:function(){
		return this.value;
	},
	
	override:function(){
		if(this.animating){
			this.animation.cancel().fireEvent('onChainComplete');
			this.setValue(this.value);
		}
	}
});