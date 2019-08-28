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
                // Branches of the tree that don't have "glyphicon-collapse-up" class are ignored.
                var toRows = function(object, prefix = "id", level = 0) {
                    if (object == null) return "";
                    console.log(object);

                    var unchecked = "<span class='glyphicon glyphicon-unchecked capnp-clickable'></span>";
                    var expand = "<span class='glyphicon glyphicon-expand capnp-clickable'></span>";
                    var collapse = "<span class='glyphicon glyphicon-collapse-up capnp-clickable'></span>";
                    var remove = "<span class='glyphicon glyphicon-remove capnp-clickable'></span>";
                    
                    return $.map(object, function(value, key) { 
                        var id = prefix + "-" + key
                        var expandable = value instanceof Object;
                        var collapsable = expandable && $("#" + id + " > td > span").hasClass("glyphicon-collapse-up");
                        return    "<tr id='" + id + "' name='" + id.replace("id-", "").replace(/-/g, ".") + "'>"
                                +    "<td>" + "&nbsp;".repeat(level*4) 
                                +      (value == null   ? unchecked :
                                         collapsable     ? collapse : 
                                         expandable      ? expand : "")
                                +      key
                                +    "</td>"
                                +    (expandable ? "<td></td>" : "<td>" + value + "</td>")
                                +  "</tr>"
                                // recourse into the tree
                                +  (collapsable ? toRows(value, id, level + 1) : "");
                    });
                };

                // This function updates the #tree-table element from "response" received from the server
                // it is used when performing any tree-table update, local or requiring request to the server
                updateTableLocal = function() {
                    $("#tree-table").html(toRows(response).join("\n"));
                    $(".capnp-clickable.glyphicon-expand").click(function() {
                        $(this).removeClass("glyphicon-expand").addClass("glyphicon-collapse-up");
                        updateTableLocal();
                    });
                    $(".capnp-clickable.glyphicon-collapse-up").click(function() {
                        $(this).removeClass("glyphicon-collapse-up").addClass("glyphicon-expand");
                        updateTableLocal();
                    });
                    $(".capnp-clickable.glyphicon-unchecked").click(function() {
                        updateTable({initialize : $(this).closest("tr").attr("name"),
                                     object : response});
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
