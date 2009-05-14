/*
 *  Copyright (c) 2008 ToI-Planning, All rights reserved.
 *
 *  Redistribution and use in source and binary forms, with or without
 *  modification, are permitted provided that the following conditions
 *  are met:
 *
 *  1. Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 *
 *  2. Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 *
 *  3. Neither the name of the authors nor the names of its contributors
 *     may be used to endorse or promote products derived from this
 *     software without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 *  "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 *  LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 *  A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 *  OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 *  SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
 *  TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 *  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 *  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 *  SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 *  $Id$
 */

/* Loading external libraries. */
if (typeof Prototype === 'undefined') {
	(function(){
		var use_local_prototype_js = false;
		var base_url = '';
		if (use_local_prototype_js) {
			var ss = document.getElementsByTagName("script");
			var re = new RegExp(/mt-rebuild.js/);
			var i;
			for(i = 0; i < ss.length; i++) {
				s = ss[i];
				if (s.src) {
					var index = s.src.search(/mt-rebuild.js/);
					if (index != -1) {
						base_url = s.src.substring(0, index);
					}
				}
			}
		}
		else {
			base_url = 'http://ajax.googleapis.com/ajax/libs/prototype/1.6.0.2/';
		}

		var s = document.createElement("script");
		s.charset = "UTF-8";
		s.src = base_url + "prototype.js";
		document.body.appendChild(s)
	})();
}

/* Rebuilding */
function mt_rebuild(param) {
	function inner() {
		if (typeof Prototype === 'undefined') {
			setTimeout(inner, 500);
			return;
		}

		var mt = new ToIMT(param);
		mt.rebuild_all();
	}
	inner();
}

/* Instance of MT */
function ToIMT (param) {
	this.Version = '0.1';

	for(k in param) {
		this[k] = param[k];
	}
	if (! this.log) {
		if(navigator.userAgent.indexOf('Safari') != -1){ 
			this.log = function (str) { ; };
		}
		else if (
			(typeof console !== 'undefined') &&
			(typeof console.log !== 'undefined')
		) {
			this.log = console.log;
		}
		else if (
			(typeof opera !== 'undefined') &&
			(typeof opera.postError !== 'undefined')
		) {
			this.log = opera.postError;
		}
		else {
			this.log = function (str) { ; };
		}
	}
	if (! this.mt_cgi) {
		this.mt_cgi = window.location.href.sub(/\?.*/, '');
	}
	if (! this.frame) {
		var toi_mt_rebuild_window = $$('iframe[name=ToIMTRebuildWindow]');
		if (toi_mt_rebuild_window.length) {
			this.message_frame = toi_mt_rebuild_window[0];
		}
		else {
			var frames = $$('iframe[name=dialog_iframe]');
			if (frames.length) {
				this.message_frame = frames[0];
			}
			else {
				this.message_frame = new Element(
					'iframe', {name: 'mt_rebuild_js_frame'}
				);
				this.message_frame.style.width = '100%';
				this.message_frame.style.height = '250px';
				this.message_frame.style.overflow = 'hidden';
				document.body.appendChild(this.message_frame);
			}

			openDialog(false, '');
		}

		this.frame = new Element('iframe', {name: 'mt_rebuild_js_exec_frame'});
		this.frame.style.width = '0px';
		this.frame.style.height = '0px';
		this.frame.style.overflow = 'hidden';
		document.body.appendChild(this.frame);
	}
	if (! this.rebuild_queue) {
		this.rebuild_queue = [];
	}
};

/* Rebuild all blogs */
ToIMT.prototype.rebuild_all = function() {
	var self = this;
	function onListed(list) {
		var i;
		for (i = 0; i < list.length; i++) {
			list[i] = $H(list[i]);
		}

		var str = '';
		self.message_frame.contentWindow.document.open();
		self.message_frame.contentWindow.document.write(
			'<ul>' +
			list.map(function(b) {
				return '<li id="' + b.get('id') + '">' + b.get('name') +
					' <a href="' + self.mt_cgi + '?blog_id=' + b.get('id') + '" target="_blank">Home</a>' +
					' <a href="' + self.mt_cgi + '?__mode=list&_type=template&blog_id=' + b.get('id') + '" target="_blank">Design</a>' +
					' <span class="rebuild_doing" style="display: none" >Rebuilding...</span> ' +
					' <span class="rebuild_success" style="display: none" >Done</span> ' +
					'</li>';
			}).join('') +
			'</ul>' +
			'<a href="javascript: void;" id="close-dialog">Close</a>'
		);
		self.message_frame.contentWindow.document.close();

		var close = self.message_frame.contentWindow.document.getElementById('close-dialog');
		close.onclick = function() { window.close(); };


		self.rebuild_queue = list;
		self.do_rebuild();
	}

	if (self.rebuild_queue.length == 0) {
		this.list_blogs(onListed);
	}
	else {
		onListed(this.rebuild_queue);
	}
};

/* Rebuild blogs in queue. */
ToIMT.prototype.do_rebuild = function() {
	if (this.rebuild_queue.length == 0) {
		return;
	}

	var self = this;
	this.rebuild_blog(
		this.rebuild_queue.shift(),
		function (html) {
			self.do_rebuild();
		}
	);
}

/* Fetching blog information. */
ToIMT.prototype.fetch_blog_info = function(blog, onComplete) {
	var self = this;

	this.log('fetching blog information start ' + blog.get('name'));
	var param = $H({
		__mode: 'rebuild_confirm',
		blog_id: blog.get('id')
	});

	var url = this.mt_cgi + '?' + param.toQueryString();
	window.open(url, this.frame.name);

	function wait() {
		if (
			(self.frame.contentWindow) &&
			(self.frame.contentWindow.document)
		) {
			var select = [];
			$A(self.frame.contentWindow.document.getElementsByTagName('select')).each(function(elm) {
				if (elm.name == "type") {
					select.push(elm);
				}
			});
			if (select.length != 0) {
				blog.set('types', select[0].options[0].value);

				select.each(function(elm) {
					Element.remove(elm);
				});
				self.log('fetching blog information done ' + blog.get('name'));
				return onComplete();
			}
		}
		setTimeout(wait, 200);
	}
	wait();
}

/* Rebuild blog specified */
ToIMT.prototype.rebuild_blog = function(blog, onComplete) {
	var self = this;

	var li = self.message_frame.contentWindow.document.getElementById(blog.get('id'));

	li.style.textDecoration = 'underline';
	var li_nodes = li.childNodes;
	var i;
	for (i = 0; i < li_nodes.length; i++) {
		if (li_nodes[i].className == 'rebuild_doing') {
			li_nodes[i].style.display = '';
		}
	}

	function inner() {
		function inner2() {
			self.log('rebuild start ' + blog.get('name'));
			var param = $H({
				__mode: 'start_rebuild',
				blog_id: blog.get('id'),
				next: 0,
				type: blog.get('types')
			});

			var url = self.mt_cgi + '?' + param.toQueryString();
			window.open(url, self.frame.name);

			function wait() {
				if (
					(self.frame.contentWindow) &&
					(self.frame.contentWindow.document)
				) {
					var contentDocument = self.frame.contentWindow.document;
					var success = contentDocument.getElementById('message');
					if (success && success.className.search('msg-success')) {
						success.id = 'hide_message';
						self.log('rebuild success ' + blog.get('name'));

						contentDocument.getElementById(
							'hide_message'
						).style.visibility = 'hidden';
						$A(contentDocument.getElementsByTagName('button')).each(
							function(elm) {
								if (elm.accessKey == 's') {
									elm.style.visibility = 'hidden';
								}
								else {
									elm.onclick = function() {
										closeDialog();
										return false;
									};
								}
							}
						);

						li.style.textDecoration = '';
						li.style.fontWeight = 'bold';
						var li_nodes = li.childNodes;
						var i;
						for (i = 0; i < li_nodes.length; i++) {
							if (li_nodes[i].className == 'rebuild_success') {
								li_nodes[i].style.display = '';
							}
						}

						return onComplete();
					}

					var error = contentDocument.getElementById('generic-error');
					if (error) {
						error.id = 'hide_message';

						alert(error.innerHTML.replace(/.*<\/a>/, '').strip().unescapeHTML());
					}
				}
				setTimeout(wait, 500);
			}
			wait();
		}

		if (! blog.get('types')) {
			self.fetch_blog_info(blog, inner2);
		}
		else {
			inner2();
		}
	}

	inner();
};

/* Listing blogs */
ToIMT.prototype.list_blogs = function(onListed) {
	var self = this;

	this.log('fetching blog list start.');
	var url = self.mt_cgi + '?__mode=list_blogs';
	window.open(url, self.frame.name);

	self.message_frame.contentWindow.document.open();
	self.message_frame.contentWindow.document.write('Listing blgos...');

	function inner() {
		if (
			(! self.frame.contentWindow) ||
			(! self.frame.contentWindow.document) ||
			(! self.frame.contentWindow.document.getElementById('blog-listing-table'))
		) {
			setTimeout(inner, 1000);
			return;
		}

		var blogs = [];

		var table = self.frame.contentWindow.document.getElementById(
			'blog-listing-table'
		);
		var tbody = table.getElementsByTagName('tbody')[0];
		$A(tbody.getElementsByTagName('tr')).each(function(row) {
			var cols = $A(row.getElementsByTagName('td'));
			var blog = {};
			blog['id'] = cols[0].getElementsByTagName('input')[0].value;
			blog['name'] = cols[1].getElementsByTagName('a')[0].innerHTML;
			blogs.push($H(blog));
		});

		self.log('fetching blog list done');
		self.message_frame.contentWindow.document.write('done.');
		self.message_frame.contentWindow.document.close();

		onListed(blogs);
	}

	inner();
};

var mt_rebuild_rebuild_queue;
/* Do rebuild */
mt_rebuild({
	rebuild_queue: mt_rebuild_rebuild_queue
});
