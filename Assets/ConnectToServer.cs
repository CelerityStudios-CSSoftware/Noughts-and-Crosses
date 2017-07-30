using UnityEngine;
using System.Net.Sockets;
using System.Text;
using System;

public class ConnectToServer : MonoBehaviour {
    public TcpClient _serverSocket;
    private string _messageBeingReceived;
    public string ip = "132.148.22.175";
    public int port = 1413;

	// Use this for initialization
	void Start() {
        _serverSocket = new TcpClient();
        _serverSocket.Connect(ip, port);
    }

    string BufferToString(byte[] buffer) {
        return Encoding.ASCII.GetString(buffer).TrimEnd((Char)0);
    }


    void Update() {
        NetworkStream stream = _serverSocket.GetStream();
        if (stream.CanRead && stream.DataAvailable) {
            byte[] buffer = new byte[_serverSocket.ReceiveBufferSize];
            if (stream.Read(buffer, 0, buffer.Length) > 0) {
                string str = BufferToString(buffer);
                HandleString(str);
            }
        }
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
        if (msg[0] == '2') {
            _ParseEnemyMove(msg.Substring(1));
        }
    }

    private void _ParseEnemyMove(string msg) {
        GameObject obj = GameObject.Find(msg);
        if (obj != null) {
            obj.GetComponent<ChangeMaterialOnClick>().ChangeColor(false);
        }
    }

    public int WriteToServer(string message) {
        byte[] buffer = Encoding.ASCII.GetBytes(message);
        _serverSocket.GetStream().Write(buffer, 0, buffer.Length);
        return 0;
    }
}
