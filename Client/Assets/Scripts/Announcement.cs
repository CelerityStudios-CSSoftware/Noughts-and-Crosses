using UnityEngine;
using UnityEngine.UI;

[RequireComponent(typeof(CanvasGroup))]
public class Announcement : MonoBehaviour {
    public float displayDuration;
    public float fadeDuration;

    private Text _text;
    private CanvasGroup _group;

    private float _startedDisplayingTime;
    private ShowType _type;

    public enum ShowType {
        FADE_OUT,
        PERSIST
    }

    void Start() {
        _text = GetComponentInChildren<Text>();
        _group = GetComponent<CanvasGroup>();
        if (PlayerManager.instance.Self().id == 0) {
            Show("You play first");
        } else {
            Show("Player 0 plays first");
        }
    }

    public void Show(string message, ShowType type = ShowType.FADE_OUT) {
        _text.text = message;
        _group.alpha = 1f;
        _startedDisplayingTime = Time.time;
        _type = type;
    }

    void Update() {
        if (_group.alpha != 0f
          && _type == ShowType.FADE_OUT
          && Time.time > _startedDisplayingTime + displayDuration) {
            _group.alpha -= 1f / fadeDuration * Time.deltaTime;
        }
    }
}