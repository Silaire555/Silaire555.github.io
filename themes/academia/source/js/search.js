var searchFunc = function(path, search_id, content_id) {
  'use strict';
  $.ajax({
    url: path,
    dataType: "xml",
    success: function(xmlResponse) {
      var datas = $("entry", xmlResponse).map(function() {
        return {
          title: $("title", this).text(),
          url: $("url", this).text()
        };
      }).get();
      
      var $input = document.getElementById(search_id);
      var $resultContent = document.getElementById(content_id);
      
      $input.addEventListener('input', function() {
        var keywords = this.value.trim().toLowerCase().split(/[\s-]+/);
        $resultContent.innerHTML = "";
        if (this.value.trim().length === 0) return;
        
        var resultHTML = '<ul class="search-result-list">';
        var matched = false;
        
        datas.forEach(function(data) {
          var title = data.title.trim().toLowerCase();
          var isMatch = true;
          for (var i = 0; i < keywords.length; i++) {
            if (title.indexOf(keywords[i]) === -1) {
              isMatch = false;
              break;
            }
          }
          if (isMatch) {
            matched = true;
            // 高亮关键词（可选）
            var displayTitle = data.title;
            for (var i = 0; i < keywords.length; i++) {
              var regex = new RegExp('(' + keywords[i] + ')', 'gi');
              displayTitle = displayTitle.replace(regex, '<em class="search-keyword">$1</em>');
            }
            resultHTML += '<li><a href="' + data.url + '">' + displayTitle + '</a></li>';
          }
        });
        
        resultHTML += '</ul>';
        if (!matched) {
          $resultContent.innerHTML = '<p>没有找到相关文章</p>';
        } else {
          $resultContent.innerHTML = resultHTML;
        }
      });
    }
  });
};