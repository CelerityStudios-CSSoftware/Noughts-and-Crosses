using UnityEngine;
using System.Collections.Generic;
using System.Net.Sockets;
using System.Text;

public partial class Server : MonoBehaviour {
    private string _messageBeingReceived;
    private bool _paused = false;

    //TODO add arg count checking to this class
    private Dictionary<string, MessageType> _messageTypeCodes = new Dictionary<string, MessageType>() {
        { "f", MessageType.MATCHMAKING },
        { "s", MessageType.START_GAME },
        { "m", MessageType.MOVE },
        { "t", MessageType.TURN },
        { "w", MessageType.END_GAME },
        { "to", MessageType.PLAYER_TIMED_OUT }
    };

    void Update() {
        if (_socket.Connected && !_paused) {
            ReadFromServer();
        }
    }

    // Pausing the server IO allows to ensure that a message
    // handler will be set up for incoming messages when
    // switching scenes. Pause before loading a scene and
    // Unpause in the Start function of one of the MonoBehaviour
    // That sets up a handler for the message you don't want to
    // miss.
    public void Pause() {
        _paused = true;
    }

    public void Unpause() {
        _paused = false;
    }

    public bool IsPaused() {
        return _paused;
    }

    public int WriteToServer(string message) {
        byte[] buffer = Encoding.ASCII.GetBytes(message);
        _socket.GetStream().Write(buffer, 0, buffer.Length);
        return 0;
    }

    public void ReadFromServer() {
        NetworkStream stream = _socket.GetStream();
        if (stream.CanRead && stream.DataAvailable) {
            byte[] buffer = new byte[_socket.ReceiveBufferSize];
            if (stream.Read(buffer, 0, buffer.Length) > 0) {
                string str = BufferToString(buffer);
                HandleString(str);
            }
        }
    }

    string BufferToString(byte[] buffer) {
        return Encoding.ASCII.GetString(buffer).TrimEnd((System.Char)0);
    }

    void HandleString(string str) {
        _messageBeingReceived += str;
        _messageBeingReceived = _ExtractAndParseMessages(_messageBeingReceived);
    }

    private string _ExtractAndParseMessages(string msg) {
        string[] parts = msg.Split('\n');

        if (parts.Length > 1) {
            for (uint i = 0; i < parts.Length - 1; i++) {
                _ParseMessage(parts[i]);
            }
            return parts[parts.Length - 1];
        }
        return msg;
    }

    private void _ParseMessage(string msg) {
        string[] splitMsg = msg.Split(':');
        string code = splitMsg[0];
        string[] args = new string[splitMsg.Length - 1];
        System.Array.Copy(splitMsg, 1, args, 0, splitMsg.Length - 1);
        MessageType type;

        Debug.Log("Parsing " + msg + "|");
        if (_messageTypeCodes.TryGetValue(code, out type)) {
            TriggerEvent(type, args);
        }
    }
}
