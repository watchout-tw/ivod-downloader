function getURLMap(bodyHTML) {
  var urlMap = null;
  var urlMapStartIndex = bodyHTML.indexOf('"FILNAM"');
  if (urlMapStartIndex != -1) {
      urlMap = bodyHTML.substring(urlMapStartIndex);
      var urlMapEndIndex = urlMap.indexOf('",');
      if (urlMapEndIndex != -1) {
          urlMap = urlMap.substring(10, urlMapEndIndex);
      }
  }

  if (urlMap == null) throw 'Error: Couldn\'t find url map.';
  return urlMap;
}

function createForm(url) {
  var download_div = document.createElement('input');
  download_div.id = 'ivod-download-span';
  download_div.type = 'submit';
  download_div.value = "下載";
  var link = document.createElement('input');
  link.type = "text";
  link.value = url;
  link.name = "link";

  var style = download_div.style;
  style.padding = '5px';
  style.borderRadius = '1em';
  style.lineHeight = '1.6';
  style.display = 'inline-block';
  style.margin = '5px auto';
  style.boxShadow = '4px 4px 3px #999';
  style.border = '1px #999 solid';
  style.backgroundColor = '#ffe';
  var container_div = document.createElement('div');
  container_div.style.textAlign = 'center';
  var form = document.createElement('form');
  form.action = "http://ivod-ly.herokuapp.com/download";
  form.method = "post";
  form.appendChild(link);
  form.appendChild(download_div);
  container_div.appendChild(form);
  return container_div;
}

function start() {
  if (document.URL.indexOf('ivod.ly.gov.tw/Play/VOD/') == -1) return;

  var error = null;
  var urlMap = null;
  var linksAndFormats = null;
  try {
      urlMap = getURLMap(document.body.innerHTML);
  } catch (err) {
      error = err;
  }
  document.getElementsByClassName('btn-video-control-group')[0].appendChild(createForm(document.URL));
}

function start2() {
  if (document.URL.indexOf('ivod.ly.gov.tw/Legislator') == -1) return;
  $('.thumbnail-btn p').children('a').each(function(){
    var div = createForm('http://ivod.ly.gov.tw' + $(this).attr('href'));
    $(div).insertAfter($(this).parent());
  });

}

$(function() {
  start();
  var id = setInterval(function() {
    if($('.thumbnail-btn p').length > 0){
      start2();
      clearInterval(id);
    }
  }, 1000);
});
