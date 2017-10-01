using UnityEngine;
using UnityEngine.UI;

[RequireComponent(typeof(Text))]
public class BlinkText : MonoBehaviour {
    private Text _text;

    void Start() {
        _text = GetComponent<Text>();
    }

	void Update() {
        _text.color = new Color(_text.color.r, _text.color.g, _text.color.b, Mathf.PingPong(Time.time, 1));
	}
}
