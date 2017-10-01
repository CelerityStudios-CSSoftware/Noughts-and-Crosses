import select
import socket
import sys

sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

server_address = ('localhost', 1413)
print('starting up on %s port %d' % server_address)
sock.bind(server_address)

sock.listen(1)

def read_from_cli():
    return input().replace('\\n', '\n')

def repl_client(client, client_address):
    message = ''
    while True:
        try:
            ready_to_read, ready_to_write, in_error = select.select([client,], [client,], [], 5)
        except select.error:
            client.shutdown(2)
            client.close()
            print('client disconnected from ', client_address)
            break
        if message == '':
            message = read_from_cli()
        if len(ready_to_write) > 0:
            client.send(bytes(message, 'ASCII'))
            message = ''

while True:
    print('waiting for a connection')
    connection, client_address = sock.accept()
    print('connection from ', client_address)
    repl_client(connection, client_address)
