/*
 *  Copyright (c) 2008-2009 ToI-Planning, All rights reserved.
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
					var index = s.src.search(re);
					if (index != -1) {
						base_url = s.src.substring(0, index);
					}
				}
			}
		}
		else {
			base_url = '//ajax.googleapis.com/ajax/libs/prototype/1.6.0.2/';
		}

		var s = document.createElement("script");
		s.charset = "UTF-8";
		s.type = 'text/javascript';
		s.src = base_url + "prototype.js";
		document.body.appendChild(s)
	})();
}

var quickrebuild_mt_version = 5;
if (typeof(jQuery) == 'undefined') {
	quickrebuild_mt_version = 4;
}

/* closeDialog */
function mt_rebuild_close_dialog() {
	if (quickrebuild_mt_version <= 4) {
		closeDialog();
	}
	else {
		var win = parent;
		if (! parent) {
			win = window;
		}

		win.jQuery.fn.mtDialog.close();
	}
}

/* Rebuilding */
function mt_rebuild(param) {
	function inner() {
		if (typeof Prototype === 'undefined') {
			setTimeout(inner, 500);
			return;
		}

		var mt = new ToIMT(param);
		setTimeout(function() {
			mt.rebuild_all();
		}, 10);
	}
	inner();
}

/* Instance of MT */
function ToIMT (param) {
	this.Version = '0.1';
	this.Tag = (function() {
		var ss = document.getElementsByTagName("script");
		var re = new RegExp('/quickrebuild-mtplugin\\.googlecode\\.com/svn/tags/([^/]*)/tmpl/mt-rebuild\\.js');
		var i;
		for(i = 0; i < ss.length; i++) {
			var s = ss[i];
			var m = re.exec(s.src);
			if (m) {
				return m[1];
			}
		}
		return '';
	})();

	for(k in param) {
		this[k] = param[k];
	}
	this.log = function(message) {
		if (
				(typeof console !== 'undefined') &&
				(typeof console.log !== 'undefined')
		) {
			console.log(message);
		}
	};
	if (! this.mt_cgi) {
		this.mt_cgi = window.location.href.sub(/\?.*/, '');
	}
	if (! this.frame) {
		var toi_mt_rebuild_window = $$('iframe[name=ToIMTRebuildWindow]');
		if (toi_mt_rebuild_window.length) {
			this.called_by_plugin = true;
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

			try {
				openDialog(false, '');
			}
			catch(e) {
				jQuery.fn.mtDialog.open(
					ScriptURI + '?__mode=unkown'
				);
				var self = this;
				function get_quickrebuild_message_frame() {
					var frame;
					if (frame = $('mt-dialog-iframe')) {
						self.message_frame = frame;
					}
					else {
						setTimeout(get_quickrebuild_message_frame, 100);
					}
				}
				setTimeout(get_quickrebuild_message_frame, 1);
			}
		}

		var exec_frame = $$('iframe[name=mt_rebuild_js_exec_frame]');
		if (exec_frame.length) {
			this.frame = exec_frame[0];
		}
		else {
			this.frame = new Element(
				'iframe', {name: 'mt_rebuild_js_exec_frame'}
			);
			this.frame.style.width = '0px';
			this.frame.style.height = '0px';
			this.frame.style.overflow = 'hidden';
			document.body.appendChild(this.frame);
		}
	}
	if (! this.rebuild_queue) {
		this.rebuild_queue = [];
	}
};

/* Checking a new version */
ToIMT.prototype.check_version = function(onUpdated) {
	var self = this;
	if (! this.Tag) {
		return false;
	}

	window.ToIMT_loaded_tag = self.Tag;
	window.ToIMT_updated_callback = function(tag) {
		onUpdated(tag);
	};

	var s = document.createElement("script");
	s.charset = "UTF-8";
	s.type = 'text/javascript';
	s.src = '//quickrebuild-mtplugin.googlecode.com/svn/trunk/tmpl/mt-rebuild-current-tag.js';
	document.body.appendChild(s)

	return false;
};

/* Rebuild all blogs */
ToIMT.prototype.rebuild_all = function() {
	var self = this;
	function onListed(list) {
		var i, j;
		var flist = [];
		for (i = 0; i < list.length; i++) {
			list[i] = $H(list[i]);
			var blogs = list[i].get('blogs');
			if (blogs && blogs.length) {
				for (var j = 0; j < blogs.length; j++) {
					blogs[j] = $H(blogs[j]);
					flist.push(blogs[j]);
				}
			}
			flist.push(list[i]);
		}

		var buttons =
			'<input type="submit" value="Rebuild" name="start_rebuild" />' +
			'&nbsp;' +
			'<input type="submit" value="Stop" name="stop_rebuild" disabled="disabled" />' +
			'&nbsp;' +
			'<input type="submit" value="Close" name="close_dialog" />';

		var checkall_html = '';
		if (list.length >= 2) {
			checkall_html = '<li><input type="checkbox" id="checkall" checked="checked" /></li>';
		}

		self.message_frame.contentWindow.document.open();
		self.message_frame.contentWindow.document.write(
			'<style type="text/css">' +
			'#blogs ul li { list-style: none; }' +
			'#new_version a { text-decoration: none; }' +
			'#new_version input { width: 100%; }' +
			'</style>' +
			'<form id="blogs" >' +
			buttons +
			'<div id="new_version" style="display: none">mt-rebuild was updated. <a href="">Please set this link as bookmarklet.</a></div>' +
			'<ul>' +
			checkall_html +
			list.map(function(b) {
				var id = 'rebuild_' + b.get('id');

				var s = '';
				var blogs = b.get('blogs');
				if (blogs && blogs.length) {
					s = '<ul id="' + id + '_list">' + blogs.map(function(b) {
						return [ '<li id="', b.get('id'), '">',
							'<input type="checkbox" name="rebuild_', b.get('id'), '" />&nbsp;',
							b.get('name').escapeHTML(),
							' <a href="', self.mt_cgi, '?blog_id=', b.get('id'), '" target="_blank">Home</a>',
							' <a href="', self.mt_cgi, '?__mode=list&_type=template&blog_id=', b.get('id'), '" target="_blank">Design</a>',
							' <span class="rebuild_doing" style="display: none" >Rebuilding...</span> ',
							' <span class="rebuild_success" style="display: none" >Done</span> ',
							' <span class="rebuild_error" style="display: none" ></span> ',
							'</li>'
						].join('');
					}).join('') + '</ul>';
				}

				return [ '<li id="', b.get('id'), '">',
					'<input type="checkbox" name="' + id + '" id="' + id + '" />&nbsp;',
					b.get('name'),
          ('can_rebuild' in b.toObject() && ! b.get('can_rebuild')) ? '' : [
					  ' <a href="', self.mt_cgi, '?blog_id=', b.get('id'), '" target="_blank">Home</a>',
					  ' <a href="', self.mt_cgi, '?__mode=list&_type=template&blog_id=', b.get('id'), '" target="_blank">Design</a>',
          ].join(''),
					' <span class="rebuild_doing" style="display: none" >Rebuilding...</span> ',
					' <span class="rebuild_success" style="display: none" >Done</span> ',
					' <span class="rebuild_error" style="display: none" ></span> ',
					s,
					'</li>'
				].join('');
			}).join('') +
			'</ul>' +
			buttons +
			'</form>'
		);
		self.message_frame.contentWindow.document.close();

		function getById(id) {
			return self.message_frame.contentWindow.document.getElementById(id);
		}

		function getByName(name) {
			return self.message_frame.contentWindow.document.getElementsByName(
				name
			);
		}

		function forAllInput(func) {
			var f = getById('blogs');
			var inputs = f.elements;
			var i;
			for (i = 0; i < inputs.length; i++) {
				func(inputs[i]);
			}
		}

		self.check_version(function(tag) {
			var div = getById('new_version');

			var a = div.getElementsByTagName('a')[0];
			a.href = 'javascript:(function(){var%20s=document.createElement(%22script%22);s.charset=%22UTF-8%22;s.type=%22text/javascript%22;s.src=%22//quickrebuild-mtplugin.googlecode.com/svn/tags/' + tag + '/tmpl/mt-rebuild.js%22;document.body.appendChild(s)})();';
			a.onclick = function() {
				return false;
			};

			div.style.display = '';
		});

		var all = getById('checkall');
		function all_clicked() {
			forAllInput(function(i) {
				if (i.name.match(/^rebuild_\d+$/)) {
					i.checked = all ? all.checked : 'checked';
				}
			});
		};
		if (all) {
			all.onchange = all_clicked;
		}
		all_clicked();

		list.each(function(b) {
			var id = 'rebuild_' + b.get('id');
			var checkbox = getById(id);
			checkbox.onclick = function(ev) {
				var list = getById(id + '_list');
				if (list) {
					var elms = list.getElementsByTagName('input');
					for (var i = 0; i < elms.length; i++) {
						elms[i].checked = checkbox.checked;
					}
				}
			};
		});

		function stop_rebuild() {
			if (
				self.frame.contentWindow && self.frame.contentWindow.stop
			) {
				self.frame.contentWindow.stop();
			}
			self.stopped = true;

			$A(getByName('stop_rebuild')).each(function(stop) {
				stop.disabled = 'disabled';
			});
			$A(getByName('start_rebuild')).each(function(start) {
				start.disabled = '';
			});
		}

		$A(getByName('stop_rebuild')).each(function(stop) {
			stop.onclick = function() {
				stop_rebuild();
				return false;
			};
		});

		$A(getByName('close_dialog')).each(function(close) {
			close.onclick = function() {
				stop_rebuild();
				self.called_by_plugin ? window.close() : mt_rebuild_close_dialog();
				return false;
			};
		});

		$A(getByName('start_rebuild')).each(function(start) {
			start.onclick = function() {
				self.stopped = false;

				var f = getById('blogs');
				var queue = flist.map(function(b) {
					var li = getById(b.get('id'));
					li.style.textDecoration = '';
					li.style.fontWeight = '';
					li.style.color = '';
					var li_nodes = li.childNodes;
					var i;
					for (i = 0; i < li_nodes.length; i++) {
						if (
							(li_nodes[i].className) &&
							(li_nodes[i].className.match(/^rebuild_/))
						) {
							li_nodes[i].style.display = 'none';
						}
					}

					return f['rebuild_' + b.get('id')].checked ? b : null;
				}).compact();

				$A(getByName('stop_rebuild')).each(function(stop) {
					stop.disabled = '';
				});
				$A(getByName('start_rebuild')).each(function(start) {
					start.disabled = 'disabled';
				});

				self.rebuild_queue = queue;
				self.do_rebuild(function() {
					$A(getByName('stop_rebuild')).each(function(stop) {
						stop.disabled = 'disabled';
					});
					$A(getByName('start_rebuild')).each(function(start) {
						start.disabled = '';
					});
				});

				return false;
			};
		});
	}

	if (self.rebuild_queue.length == 0) {
		this.list_websites(onListed);
	}
	else {
		onListed(this.rebuild_queue);
	}
};

/* Rebuild blogs in queue. */
ToIMT.prototype.do_rebuild = function(onComplete) {
	if (this.rebuild_queue.length == 0) {
		if (onComplete) {
			onComplete();
		}
		return;
	}

  if ('can_rebuild' in this.rebuild_queue[0].toObject() && ! this.rebuild_queue[0].get('can_rebuild')) {
		var blog     = this.rebuild_queue.shift();
	  var li       = this.message_frame.contentWindow.document.getElementById(blog.get('id'));
	  var li_nodes = li.childNodes;
		var i;
		li.style.textDecoration = '';
		li.style.fontWeight = 'bold';
		for (i = 0; i < li_nodes.length; i++) {
			if (li_nodes[i].className == 'rebuild_success') {
				li_nodes[i].style.display = '';
			}
		}
    return;
  }

	var self = this;
	this.rebuild_blog(
		this.rebuild_queue.shift(),
		function (html) {
			self.do_rebuild(onComplete);
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
		return setTimeout(wait, 200);
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
				if (self.stopped) {
					return false;
				}

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
										closeDialog ? closeDialog() : window.close();
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

						li.style.textDecoration = '';
						li.style.fontWeight = 'bold';
						li.style.color = 'red';
						var li_nodes = li.childNodes;
						var i;
						for (i = 0; i < li_nodes.length; i++) {
							if (li_nodes[i].className == 'rebuild_error') {
								li_nodes[i].style.display = '';
								li_nodes[i].innerHTML = error.innerHTML.replace(/.*<\/a>/, '').strip().unescapeHTML();
							}
						}

						return onComplete();
					}
				}
				return setTimeout(wait, 500);
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

/* Listing website */
ToIMT.prototype.list_websites = function(onListed) {
	var self = this;

	this.log('fetching website list start.');

	self.message_frame.contentWindow.document.open();
	self.message_frame.contentWindow.document.write('Listing blogs...');
	self.message_frame.contentWindow.document.close();

	var sites = [];

	var mode = 'list_website';
	var table_id = 'website-listing-table';
	if (quickrebuild_mt_version <= 4) {
		mode = 'list_blogs';
		table_id = 'blog-listing-table';
	}

	function inner(offset) {
        jQuery.ajax({
            type: 'POST',
            url: CMSScriptURI,
            data: {
                __mode: "filtered_list",
                datasource: "website",
                blog_id: "0",
                columns: "name",
                limit: "50",
                page: offset,
                magic_token: jQuery('input[name="magic_token"]').val(),
                sort_by: "name",
                sort_order: "ascend",
                fid: "_allpass",
            }
        })
        .done(function(data) {
            jQuery.each(data.result.objects, function() {
                sites.push($H({
                    id: this[0],
                    name: jQuery(this[1]).text()
                }));
            });

            if (parseInt(data.result.page, 10) !== parseInt(data.result.page_max, 10)) {
                inner(parseInt(data.result.page, 10) + 1);
            }
            else {
                self.list_blogs(sites, onListed);
            }
        });
	}

	inner(1);
};

/* Listing blogs */
ToIMT.prototype.list_blogs = function(sites, onListed) {
	var self = this;

	self.log('fetching blog list start.');

	function inner(site_index, offset) {
		var blogs = [];
		if (offset == 1) {
			sites[site_index].set('blogs', blogs);
		}
		else {
			blogs = sites[site_index].get('blogs');
		}

        jQuery.ajax({
            type: 'POST',
            url: CMSScriptURI,
            data: {
                __mode: "filtered_list",
                datasource: "blog",
                blog_id: sites[site_index].id,
                columns: "name",
                limit: "50",
                page: offset,
                magic_token: jQuery('input[name="magic_token"]').val(),
                sort_by: "name",
                sort_order: "ascend",
                fid: "_allpass",
            }
        })
        .done(function(data) {
            jQuery.each(data.result.objects, function() {
                blogs.push($H({
                    id: this[0],
                    name: jQuery(this[1]).text()
                }));
            });

            if (parseInt(data.result.page, 10) !== parseInt(data.result.page_max, 10)) {
                inner(parseInt(data.result.page, 10) + 1);
            }
            else {
			    if (site_index+1 < sites.length) {
				    inner(site_index+1, 1);
			    }
			    else {
				    self.log('fetching blog list done');
				    self.message_frame.contentWindow.document.write('done.');
				    self.message_frame.contentWindow.document.close();

				    onListed(sites);
			    }
            }
        });
	}

	inner(0, 1);
};

var mt_rebuild_rebuild_queue;
/* Do rebuild */
mt_rebuild({
	rebuild_queue: mt_rebuild_rebuild_queue
});
