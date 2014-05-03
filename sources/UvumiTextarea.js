/*
UvumiTools TextArea v1.1.0 http://tools.uvumi.com/textarea.html

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

var UvumiTextarea = new Class({

	Implements:Options,

	options:{
		selector:'textarea',	//textareas CSS selector, default 'textarea' select all textboxes in the document. ALSO ACCEPTS AN ELEMENT OR AN ID
		
		maxChar:1000,			//maximum number of characters per textarea. SET TO 0 OR FALSE TO DESACTIVATE COUNTER
		
		maxSize:false,
		
		resizeDuration:250,		//animation duration of progress bar and resizing, in milliseconds
		
		minSize:false,			//minimum height in pixels you can reduce the textarea to. If set to false, the default value, the original textarea's height will be used as a minimum
				
		catchTab:false,			//if the textarea should override the tab default event and insert a tab in the text. Default is true, but if you're not going to support it on the back-end, you should disable it
		
		classPrefix:'tb'		//The CSS classes associated to the new elements will start with the string defined in this option.
								//Usefull if you use this plugin on several pages with different styles. if you have a red theme and a blue theme,
								//initialize an instance with classPrefix:'red' and another with classPrefix:'blue', and you'll just have to create a set of CSS rules
								//redControls, redProgress, redProgressBar, redCounter and another where you replace red by blue, blueControls, blueProgress...
	},

	initialize: function(options){
		this.setOptions(options);
		//each textarea will have its own elements, all storred in arrays
		this.tbDummies =[];
		this.tbCounters =[];
		this.tbProgress = [];
		this.tbProgressBar = [];
		window.addEvent('domready',this.domReady.bind(this));
	},
	
	domReady: function(){
		//the text area array is initialized with an optional CSS selector. The default selector is just 'textarea', affecting all textareas in the document
		if(document.id(this.options.selector)){
			this.options.selector = document.id(this.options.selector);
		}
		this.textareas=$$(this.options.selector);
		this.textareas.each(this.buildProgress,this);
		if(this.options.maxChar){
			this.tbProgressEffects = new Fx.Elements(this.tbProgressBar,{
				duration:'short',
				link:'cancel'
			});
		}
		this.tbEffects = new Fx.Elements(this.textareas,{
			duration:this.options.resizeDuration,
			link:'cancel'
		});
		this.textareas.each(function(el,i){
			var value = el.get('value');
			this.previousLength = value.length;
			if(this.options.maxChar){
				if(this.previousLength > this.options.maxChar){
					value = value.substring(0, this.options.maxChar);
					this.previousLength = value.length;
					el.set('value', value);
				}
				var count = this.options.maxChar - this.previousLength;
				var percentage = (count * this.tbProgress[i].getSize().x / this.options.maxChar).toInt();
				this.tbProgressBar[i].setStyle('width',percentage);
				if(!count){
					var ct = 'No character left';
				}else if(count == 1){
					var ct = '1 character left';
				}else{
					var ct = count + ' characters left';
				}
				this.tbCounters[i].set('text',ct);
			}
			this.tbDummies[i].set('value',value);
			var height = Math.max(this.tbDummies[i].getScrollSize().y,this.options.minSize);
			if(this.options.maxSize){
				height = Math.min(height,this.options.maxSize);
			}
			if(this.tbDummies[i].retrieve('height')!=height){
				
				this.tbDummies[i].store('height',height);
				el.setStyle('height',height);
			}
		},this);
	},
	
	//this functions builds all the new HTML elements and assigns events
	buildProgress: function(textbox,i){
		textbox.setStyle('overflow','hidden');
		//if minimum size option is false, we use the original size as minimum.
		if(!this.options.minSize){
			this.options.minSize = textbox.getSize().y;
		}
		
		//This will not be visible by user. It's div with the exact same specification as the textarea : same size, same font, same padding, same line-height....
		//on every key stroke, the textarea content is copied in this div, and if the div size is different from on previous key stroke, the textarea grow or shrink to this new height.
		//we had to use this hack because if working diretly with the textarea itself, comparing it's height and scroll-height, it wored fine for growing, but there was to good looking way to make it shrink to the right position.
		
		this.tbDummies[i] = textbox.clone().addClass('sticker').setStyles({
				'width':textbox.getStyle('width').toInt(),
				'position':'absolute',
				'top':0,
				'height':this.options.minSize,
				'left':-3000
		}).store('height',0).inject(document.id(document.body));
		
		textbox.addEvents({
			'keydown':function(event){
				this.onKeyPress.bind(this,[event,i,this.options.catchTab]);
			}, // here and like on all the other events, we must use bindWithEvent because we pass an additionnal parameter beside the event object
			'keyup':function(event){
				this.onKeyPress.bind(this,[event,i])
			},
			'focus':this.startObserver.bind(this,i),
			'blur':this.stopObserver.bind(this)
		});
		
		if(this.options.maxChar){
			this.tbProgress[i]=new Element('div',{
				'class':this.options.classPrefix+'Progress',
				'styles':{
					'position':'relative',
					'overflow':'hidden',
					'display':'block',
					'width':textbox.getSize().x-2,
					'margin':'5px 0 5px '+textbox.getPosition(textbox.getParent()).x+'px'
				}
			}).inject(textbox,'after');
			this.tbProgressBar[i]=new Element('div',{
				'class':this.options.classPrefix+'ProgressBar',
				'styles':{
					'position':'absolute',
					'top':0,
					'left':0,
					'height':'100%',
					'width':'100%'
				}
			}).inject(this.tbProgress[i]);
			this.tbCounters[i] = new Element('div', {
				'class':this.options.classPrefix+'Counter',
				'styles':{
					'position':'absolute',
					'top':0,
					'left':0,
					'height':'100%',
					'width':'100%',
					'text-align':'center'
				}
			}).inject(this.tbProgress[i]);
			this.update = this.updateCounter;
		}else{
			this.update = this.updateNoCounter;
		}
	},
	
	onKeyPress: function(event,i,tab) {
		if(tab && event.key == "tab"){
			event.preventDefault();
			this.insertTab(i);
		}
		if(!event.shift && !event.control && !event.alt && !event.meta){
			this.update(i);
		}
		this.startObserver(i);
	},
	
	startObserver:function(i){
		clearInterval(this.observer);
		this.observer = this.observe.periodical(500,this,i);
	},
	
	stopObserver:function(){
		clearInterval(this.observer);
	},
	
	observe:function(i){
		if(this.textareas[i].get('value').length != this.previousLength){
			this.previousLength = this.textareas[i].get('value').length;
			this.update(i);
		}
	},

	updateCounter: function(i) {
		var value = this.textareas[i].get('value');
		if(value.length > this.options.maxChar){
			value =  value.substring(0, this.options.maxChar);
			this.textareas[i].set('value',value);
		}
		this.previousLength = value.length;
		var count = this.options.maxChar - this.previousLength;
		var percentage = (count * this.tbProgress[i].getSize().x / this.options.maxChar).toInt();
		var effect = {};
		effect[i]={'width':percentage};
		this.tbProgressEffects.start(effect);
		if (count == 0) {
			var ct = 'No character left';
			this.tbProgress[i].highlight("#f66");
		}else if (count == 1){
			var ct = '1 character left';
		}else{
			var ct = count + ' characters left';
		}
		this.tbCounters[i].set('text',ct);
		this.updateHeight(i,value);
	},
	
	updateNoCounter:function(i){
		var value = this.textareas[i].get('value');
		this.previousLength = value.length;
		this.updateHeight(i,value);
	},
	
	updateHeight: function(i,value){
		this.tbDummies[i].set('value',value);
		var height = Math.max(this.tbDummies[i].getScrollSize().y,this.options.minSize);
		if(this.options.maxSize){
			height = Math.min(height,this.options.maxSize);
		}
		if(this.tbDummies[i].retrieve('height')!=height){
			if(height == this.options.maxSize){
				var carret = this.getCursorPosition(i);
				this.textareas[i].setStyle('overflow','auto');
				this.setCursorPosition(i,carret);
			}else if(this.textareas[i].getStyle('overflow')=='auto'){
				var carret = this.getCursorPosition(i);
				this.textareas[i].setStyle('overflow','hidden');
				this.setCursorPosition(i,carret);
			}
			this.tbDummies[i].store('height',height);
			effect = {};
			effect[i]={'height':height};
			this.tbEffects.start(effect);
		}
	},
	
	insertTab: function(i){
		if(Browser.ie) {
			var range = document.selection.createRange();
			range.text = "\t";
		}else{
			var start = this.textareas[i].selectionStart;
			var end = this.textareas[i].selectionEnd;
			var value = this.textareas[i].get('value');
			this.textareas[i].set('value', value.substring(0, start) + "\t" + value.substring(end, value.length));
			start++;
			this.textareas[i].setSelectionRange(start, start);
		}
	},
	
	getCursorPosition:function(i){
		if(Browser.ie){
			this.textareas[i].focus();
			var range = document.selection.createRange();
			var re = this.textareas[i].createTextRange();
			var dupe = re.duplicate();
			re.moveToBookmark(range.getBookmark());
			dupe.setEndPoint('EndToStart', re);
			return dupe.text.length;
		}
		return this.textareas[i].selectionStart;
	},
	
	setCursorPosition:function(i,pos){
		this.textareas[i].focus();
		if(Browser.ie) {
			var range = this.textareas[i].createTextRange();
			range.collapse(true);
			range.moveStart('character', pos);
			range.moveEnd('character', 0);
			range.select();
		}else{
			this.textareas[i].setSelectionRange(pos, pos);
		}
	},
	
	destroy:function(){
		clearInterval(this.observer);
		this.textareas.removeEvents();
		this.tbEffects.cancel();
		$$(this.tbDummies.append(this.tbProgress)).destroy();
	}
});