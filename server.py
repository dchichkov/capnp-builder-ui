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
               Adds {key : None} as placeholders for uninitialized fields of
               the _DynamicStructBuilder using the obj.schema.fields
    """

    def default(self, obj):
        if isinstance(obj, capnp.lib.capnp._DynamicStructBuilder):
            # add uninitialized fields, set values to null
            def attr(key):
                try:
                    return (key, getattr(obj, key, None))
                except:
                    return (key, None)
            return dict(attr(key) for key in obj.schema.fields)
        if isinstance(obj, capnp.lib.capnp._DynamicListBuilder):
            return [item for item in obj] + [None]
        if isinstance(obj, capnp.lib.capnp._DynamicEnum):
            return json.JSONEncoder.default(self, obj)
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
def get_update():
    object = sample_capnp.Serialization.new_message()
    # object = sample_capnp.TestStruct.new_message(blobField=b'valid utf8:\0\1\2"',int64Field=123456789012345678)
    print(request.json)
    if 'object' in request.json:
        print(request.json['object'])
        object.from_dict(request.json['object'])
    if 'initialize' in request.json:
        item, path = object, request.json['initialize'].split('.')
        for key in path[:-1]:
            item = getattr(item, key)
        try:
            item.init(path[-1])
        except:
            item.init(path[-1], size=1)

    return jsonify(object)


if __name__ == '__main__':
    app.run(debug=True)
