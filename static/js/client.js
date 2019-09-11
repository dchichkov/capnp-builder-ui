$(function () {
    // This function sends an AJAX request to /capnp-builder/api/v1.0/update containing optional:
    //  initialize : path.to.the.field to initialize or set,
    //  object     : {serialized CapNProto object}, as received from the responce previously
    //  value      : value of the field to set or update
    // fields.
    //
    // It receives {serialized CapNProto object} and displays it in a form of tree-table
    // in the #tree-table HTML element of the document. It is used for all updates of the object.
    updateTable = function(request = {}) {
        $.ajax({
            url: '/capnp-builder/api/v1.0/update',
            contentType:"application/json",
            dataType:"json",
            data: JSON.stringify(request),
            type: 'POST',
            success: function(response) {
                // This function takes a tree-like Json object as an input and flattens that tree, 
                // creating a list of <tr> elements identified by "id_key_key_..." strings.
                // Branches of the tree that don't have "capnp-collapse" class are ignored.
                var toRows = function(object, prefix = "id", level = 0) {
                    if (object == null) return "";
                    console.log(object);

                    // Note, only native html elements and inline styles are used, 
                    // in an attempt to make this code framework independent                    
                    var unchecked = "<span style='font-size:medium;' class='capnp-unchecked capnp-clickable'>&#8865;</span>";
                    var expand = "<span style='font-size:medium;' class='capnp-expand capnp-clickable'>&#8862;</span>";
                    var collapse = "<span style='font-size:medium;' class='capnp-collapse capnp-clickable'>&#8863;</span>";
                    var remove = "<span style='font-size:small; color:lightgray' class='capnp-remove capnp-clickable'>&#8864;</span>";
                    var dropdown = "<span style='font-size:medium; color:lightgray; float:right;' class='capnp-dropdown capnp-clickable'>&#9660;</span>";                                    
                    //var down = "<span style='font-size:medium; color:lightgray' class='capnp-down capnp-clickable'>&#8675;&nbsp;</span>";
                    
                    
                    return $.map(object, function(value, key) { 
                        var id = prefix + "-" + key
                        var expandable = value instanceof Object;
                        var collapsable = expandable && $("#" + id + " > td > span").hasClass("capnp-collapse");
                        return    "<tr id='" + id + "' name='" + id.replace("id-", "").replace(/-/g, ".") + "'>"
                                +    "<td style='padding:0 !important;'>" + "&nbsp;".repeat(level*6) 
                                +      (value == null   ? unchecked :
                                         collapsable     ? collapse : 
                                         expandable      ? expand   : "&nbsp;".repeat(3))
                                +    "<span style='font-size:medium; color:lightgray'>&#9482;</span>"
                                +      key
                                +    ((collapsable || expandable) ? "&nbsp;" + remove : "")
                                +    "</td>"
                                +    (expandable ? "<td style='padding:0 !important;'></td>"
                                                 //: "<td class='capnp-value' contenteditable='true' style='padding:0 !important;'>" + value + "</td>")
                                                 : "<td class='capnp-value' style='padding:0 !important;'>" +  value + dropdown + "</td>")
                                                 
                                +  "</tr>"
                                // recourse into the tree
                                +  (collapsable ? toRows(value, id, level + 1) : "");
                    });
                };

                updateValue = function() {
                    updateTable({initialize : $(this).closest("tr").attr("name"),
                                 value : $(this).text(),
                                 object : response});
                };

                // This function updates the #tree-table element from "response" received from the server
                // it is used when performing any tree-table update, local or requiring request to the server
                updateTableLocal = function() {
                    $("#tree-table").html(toRows(response).join("\n"));
                    $(".capnp-expand").click(function() {
                        $(this).removeClass("capnp-expand").addClass("capnp-collapse");
                        updateTableLocal();
                    });
                    $(".capnp-collapse").click(function() {
                        $(this).removeClass("capnp-collapse").addClass("capnp-expand");
                        updateTableLocal();
                    });
                    $(".capnp-unchecked").click(function() {
                        updateTable({initialize : $(this).closest("tr").attr("name"),
                                     object : response});
                    });
                    $(".capnp-remove").click(updateValue);
                    $(".capnp-value").focusout(updateValue);
                    $(".capnp-dropdown").click(function(event) {
                        var $td = $(this).closest("td");
                        $("<div id='capnp-dropdown-menu' class='capnp-dropdown-menu'>"
                        +   "<div class='capnp-dropdown-current-item'>" + $td.html() + "</div>"
                        +   "<div class='capnp-dropdown-item'>kRed</div>"
                        +   "<div class='capnp-dropdown-item'>kWhite<div>"
                        + "</div>").css({
                            "position" : "absolute",
                            "left"     : $td.position().left,
                            "top"      : $td.position().top,
                            "width"    : $td.width(),
                            "border"   : "2px solid lightgray",
                            "background-color" : "white",
                        }).appendTo($td.closest("table"));

                        $(".capnp-dropdown-item").click(updateValue);                        
                        $(".capnp-dropdown-menu").click(function() {
                            $(this).remove();
                        });
                    });
                }

                // Perform initial update of the #tree-table
                updateTableLocal();                
            },
            error: function(error) {
                console.error(error);
            }
        });
    };
    updateTable();
});
