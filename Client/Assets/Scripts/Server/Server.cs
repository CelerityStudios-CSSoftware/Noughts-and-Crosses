﻿using UnityEngine;
using System.Net.Sockets;
using UnityEngine.Events;
using System.Collections.Generic;
using System.Net;

public partial class Server : MonoBehaviour {
    public class MessageEvent : UnityEvent<string[]> { }

    public enum MessageType {
        CONNECTION_ID,
        MATCHMAKING,
        START_GAME,
        TURN,
        MOVE,
        END_GAME,
        PLAYER_DISCONNECTED,
        PLAYER_TIMED_OUT
    }

    private Dictionary<MessageType, MessageEvent> _eventDictionary;
    private static Server _instance;
    private TcpClient _socket;

    public static Server instance {
        get {
            if (!_instance && !(_instance = FindObjectOfType<Server>())) {
                Debug.LogError("There needs to be one active Server script on a GameObject in your scene.");
            }
            return _instance;
        }
    }

    void Awake() {
        DontDestroyOnLoad(transform.gameObject);
    }

    void Start() {
        _socket = new TcpClient();
        _eventDictionary = new Dictionary<MessageType, MessageEvent>();
    }

    public static void Connect(string address, int port) {
        instance._socket.Connect(address, port);
    }

    public static void Disconnect() {
        instance._socket.Close();
        ((System.IDisposable)instance._socket).Dispose();
        instance._socket = new TcpClient();
    }

    public static void Reset() {
        var endPoint = ((IPEndPoint)instance._socket.Client.RemoteEndPoint);
        string address = endPoint.Address.ToString();
        int port = endPoint.Port;
        Disconnect();
        Connect(address, port);
    }

    public static void AddListener(MessageType type, UnityAction<string[]> listener) {
        MessageEvent thisEvent = null;
        if (instance._eventDictionary.TryGetValue(type, out thisEvent)) {
            thisEvent.AddListener(listener);
        } else {
            thisEvent = new MessageEvent();
            thisEvent.AddListener(listener);
            instance._eventDictionary.Add(type, thisEvent);
        }
    }

    public static void RemoveListener(MessageType type, UnityAction<string[]> listener) {
        // This is useful if during shutdown the server is destroyed before the listener is removed
        if (_instance == null) return;
        MessageEvent thisEvent = null;
        if (instance._eventDictionary.TryGetValue(type, out thisEvent)) {
            thisEvent.RemoveListener(listener);
        }
    }

    public static void TriggerEvent(MessageType type, string[] arg) {
        MessageEvent thisEvent = null;
        if (instance._eventDictionary.TryGetValue(type, out thisEvent)) {
            thisEvent.Invoke(arg);
        }
    }
}
