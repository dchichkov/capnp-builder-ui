#!/usr/bin/python3
from flask import Flask, json, jsonify, make_response, request, send_from_directory
import capnp
import sample_capnp


class CapnpJSONEncoder(json.JSONEncoder):
    """
        This custom encoder:
            1. Checks if the type is _DynamicListBuilder, encodes it as list
               Adds None as a placeholder to the end of that list
            2. Checks if the type is _DynamicStructBuilder, encodes it as dict
               Adds {key : None} as placeholders for unnamed fields of
               the _DynamicStructBuilder using the obj.schema.fields
    """

    def default(self, obj):
        if isinstance(obj, capnp.lib.capnp._DynamicStructBuilder):
            # It's a struct, inject unnamed fields from its schema. Set their values to null.
            def key_value_or_none(key, field):
                try: return (key, getattr(obj, key, None))
                #except: return (key + " : " + str(field.proto.slot.type.which), None)
                except: return (key, None)
            return dict(key_value_or_none(key, field) for key, field in obj.schema.fields.items())
        if isinstance(obj, capnp.lib.capnp._DynamicListBuilder):
            return [item for item in obj] + [None]
        if isinstance(obj, capnp.lib.capnp._DynamicEnum):
            return str(obj)
        return json.JSONEncoder.default(self, obj)


class CapnpJSONDecoder(json.JSONDecoder):
    """
        This custom decoder:
            1. filters out dict elements that contain value None
            2. pops last elements of list (that should be None)
    """

    def __init__(self, *args, **kwargs):
        json.JSONDecoder.__init__(
            self, object_hook=self.object_hook, *args, **kwargs)

    def object_hook(self, obj):
        # remove None placeholders from dicts and lists
        filtered = dict((key, value)
                        for key, value in obj.items() if value is not None)
        for value in obj.values():
            if isinstance(value, list):
                none = value.pop()
                assert(none == None)

        return filtered


#
# Define Flask App and its services
#
app = Flask(__name__, static_url_path='', static_folder='static')
app.json_encoder = CapnpJSONEncoder
app.json_decoder = CapnpJSONDecoder


@app.route("/")
def index():
    return app.send_static_file('index.html')


@app.route('/capnp-builder/api/v1.0/update', methods=['POST'])
def post_update():
    """Initializes field of 'object' accessed by 'name' to 'value'. """
    # object = sample_capnp.TestStruct.new_message(blobField=b'valid utf8:\0\1\2"',int64Field=123456789012345678)
    print(request.json)

    if 'object' in request.json:
        # set values in json, before we parse the object
        if 'name' in request.json and 'value' in request.json:
            item, name = request.json['object'], request.json['name'].split('.')
            for key in name[:-1]: item, key = item[key], name[-1]
            if request.json['value'] == None:
                del item[key]
            else:
                item[key] = type(item[key]) (request.json['value'])
        # parse json into object
        print(request.json['object'])
        object = sample_capnp.Serialization.new_message(**request.json['object'])
    else:
        object = sample_capnp.Serialization.new_message(header={'messageNumber': 2})

    if 'name' in request.json and 'value' not in request.json:
        item, name = object, request.json['name'].split('.')
        for key in name[:-1]: item, key = getattr(item, key), name[-1]
        try:
            item.init(key)
        except:
            item.init(key, size=1)

    return jsonify(object)

@app.route('/capnp-builder/api/v1.0/list', methods=['POST'])
def post_list():
    """Request a list of enumerants for field of 'object' accessed by 'name'. """
    schema = sample_capnp.Serialization.new_message(**request.json['object']).schema
    item, name = request.json['object'], request.json['name'].split('.')
    for key in name: schema = schema.fields[key].schema
    return jsonify(list(schema.enumerants.keys()))


if __name__ == '__main__':
    app.run(debug=True)
