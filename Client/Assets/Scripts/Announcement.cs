using UnityEngine;
using UnityEngine.Events;
using UnityEngine.UI;

// WIP so not guaranteed bugless

[RequireComponent(typeof(CanvasGroup))]
[RequireComponent(typeof(RectTransform))]
public class Announcement : MonoBehaviour {
    public float displayDuration;
    public float fadeDuration;
    public Button leftButton;
    public Button rightButton;
    public GameObject collisionBlocker;

    private Text _text;
    private Text _leftButtonText;
    private Text _rightButtonText;
    private CanvasGroup _group;
    private RectTransform _rTransform;

    private float _startedDisplayingTime;
    private ShowType _type;
    // Default height when buttons are hidden
    private float _initialHeight;
    private float _extraButtonHeight;

    private const float _BUTTON_PADDING = 25f;

    public enum ShowType {
        FADE_OUT,
        PERSIST
    }

    void Start() {
        _text = GetComponentInChildren<Text>();
        _leftButtonText = leftButton.GetComponentInChildren<Text>();
        _rightButtonText = rightButton.GetComponentInChildren<Text>();
        _group = GetComponent<CanvasGroup>();
        _rTransform = GetComponent<RectTransform>();
        _initialHeight = _rTransform.sizeDelta.y;
        // We assume that the buttons are the same height
        _extraButtonHeight = leftButton.GetComponent<RectTransform>().sizeDelta.y + _BUTTON_PADDING;
        collisionBlocker.SetActive(false);
        if (PlayerManager.instance.Self().id == 0) {
            Show("You play first");
        } else {
            Show("Player 0 plays first");
        }
    }

    public void Show(string message, ShowType type = ShowType.FADE_OUT) {
        _disableButtons();
        _text.text = message;
        if (type == ShowType.PERSIST) collisionBlocker.SetActive(true);
        _group.alpha = 1f;
        _startedDisplayingTime = Time.time;
        _type = type;
    }

    public void ShowButtons(string leftText, string rightText, UnityAction left, UnityAction right) {
        _leftButtonText.text = leftText;
        _rightButtonText.text = rightText;
        leftButton.onClick.AddListener(left);
        rightButton.onClick.AddListener(right);
        _activateButtons();
    }

    private void _activateButtons() {
        _rTransform.sizeDelta = new Vector2(_rTransform.sizeDelta.x, _initialHeight + _extraButtonHeight);
        leftButton.gameObject.SetActive(true);
        rightButton.gameObject.SetActive(true);
    }

    private void _disableButtons() {
        leftButton.gameObject.SetActive(false);
        rightButton.gameObject.SetActive(false);
        _rTransform.sizeDelta = new Vector2(_rTransform.sizeDelta.x, _initialHeight);
    }

    void Update() {
        if (_group.alpha > 0f
          && _type == ShowType.FADE_OUT
          && Time.time > _startedDisplayingTime + displayDuration) {
            _group.alpha -= 1f / fadeDuration * Time.deltaTime;
            if (_group.alpha <= 0f) collisionBlocker.SetActive(false);
        }
    }
}