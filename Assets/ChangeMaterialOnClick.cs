using UnityEngine;

public class ChangeMaterialOnClick : MonoBehaviour {
    public PlayerColor playerColor;
    public PlayerColor enemyColor;
    public uint x;
    public uint y;
    public ConnectToServer server;

    private Renderer _renderer;

    void Start() {
        _renderer = GetComponent<Renderer>();
    }

    // Update is called once per frame
	void OnMouseDown() {
        Debug.Log("poke");
        ChangeColor(true);
        server.WriteToServer("" + x + ":" + y + "\n");
	}

    public void ChangeColor(bool selfColor) {
        _renderer.material = (selfColor ? playerColor.color : enemyColor.color);
    }
}
