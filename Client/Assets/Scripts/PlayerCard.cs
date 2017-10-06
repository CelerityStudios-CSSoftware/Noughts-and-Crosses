using UnityEngine;
using UnityEngine.UI;

public class PlayerCard : MonoBehaviour {
    private Text _nameLabel;
    private Image _playerIcon;

    void Start () {
        _nameLabel = GetComponentInChildren<Text>();
        _playerIcon = GetComponentsInChildren<Image>()[1];
    }

    public void SetPlayer(Player player) {
        _nameLabel.text = "Player " + player.id;
        _playerIcon.sprite = player.icon.sprite;
        _playerIcon.color = player.color;
    }
}
