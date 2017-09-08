using System.Text;
using System.Net.Sockets;
using System.Windows;

namespace Noguhts_and_Crosses
{
	public partial class MainWindow : Window
	{
		private const string IPAddress = "127.0.0.1";
		private const int Port = 12345;

		private TcpClient Client = new TcpClient();
		private NetworkStream ClientStream;

		private int PlayerIndex;
		private int PlayerTurn;
		private int[,] gameBoard = new int[,] { { -1, -1, -1 }, { -1, -1, -1 }, { -1, -1, -1 } };

		public MainWindow()
		{
			InitializeComponent();

			Matchmake();
		}

		private async void Matchmake()
		{
			MessageBox.Show("Connecting...");

			await Client.ConnectAsync(IPAddress, Port);
			ClientStream = Client.GetStream();

			SocketListen();
		}

		private async void SocketSend(string data)
		{
			byte[] bytes = Encoding.ASCII.GetBytes(data);
			await ClientStream.WriteAsync(bytes, 0, bytes.Length);
		}

		private async void SocketListen()
		{
			byte[] buffer = new byte[256];

			while (true)
			{
				int length = await ClientStream.ReadAsync(buffer, 0, buffer.Length);
				string[] result = Encoding.ASCII.GetString(buffer, 0, length).Split(char.Parse(":"));

				if (result[0] == "f")
				{
					MessageBox.Show("Matchmaking: " + result[1] + "/" + result[2]);
				}
				else if (result[0] == "s")
				{
					PlayerIndex = int.Parse(result[1]);
					PlayerTurn = 0;

					MessageBox.Show("You are player " + (PlayerIndex + 1) + "!");

					if (PlayerIndex == 0)
					{
						MessageBox.Show("Your turn!");
					}
					else
					{
						MessageBox.Show("Player 1's turn... Waiting for your turn.");
					}
				}
				else if (result[0] == "m")
				{
					gameBoard[int.Parse(result[1]), int.Parse(result[2])] = PlayerTurn;

					if (int.Parse(result[1]) == 0 && int.Parse(result[2]) == 0)
					{
						if (PlayerTurn == 0)
						{
							GameGridTL.Content = "O";
						}
						else if (PlayerTurn == 1)
						{
							GameGridTL.Content = "X";
						}
					}
					else if (int.Parse(result[1]) == 0 && int.Parse(result[2]) == 1)
					{
						if (PlayerTurn == 0)
						{
							GameGridTC.Content = "O";
						}
						else if (PlayerTurn == 1)
						{
							GameGridTC.Content = "X";
						}
					}
					else if (int.Parse(result[1]) == 0 && int.Parse(result[2]) == 2)
					{
						if (PlayerTurn == 0)
						{
							GameGridTR.Content = "O";
						}
						else if (PlayerTurn == 1)
						{
							GameGridTR.Content = "X";
						}
					}
					else if (int.Parse(result[1]) == 1 && int.Parse(result[2]) == 0)
					{
						if (PlayerTurn == 0)
						{
							GameGridCL.Content = "O";
						}
						else if (PlayerTurn == 1)
						{
							GameGridCL.Content = "X";
						}
					}
					else if (int.Parse(result[1]) == 1 && int.Parse(result[2]) == 1)
					{
						if (PlayerTurn == 0)
						{
							GameGridCC.Content = "O";
						}
						else if (PlayerTurn == 1)
						{
							GameGridCC.Content = "X";
						}
					}
					else if (int.Parse(result[1]) == 1 && int.Parse(result[2]) == 2)
					{
						if (PlayerTurn == 0)
						{
							GameGridCR.Content = "O";
						}
						else if (PlayerTurn == 1)
						{
							GameGridCR.Content = "X";
						}
					}
					else if (int.Parse(result[1]) == 2 && int.Parse(result[2]) == 0)
					{
						if (PlayerTurn == 0)
						{
							GameGridBL.Content = "O";
						}
						else if (PlayerTurn == 1)
						{
							GameGridBL.Content = "X";
						}
					}
					else if (int.Parse(result[1]) == 2 && int.Parse(result[2]) == 1)
					{
						if (PlayerTurn == 0)
						{
							GameGridBC.Content = "O";
						}
						else if (PlayerTurn == 1)
						{
							GameGridBC.Content = "X";
						}
					}
					else if (int.Parse(result[1]) == 2 && int.Parse(result[2]) == 2)
					{
						if (PlayerTurn == 0)
						{
							GameGridBR.Content = "O";
						}
						else if (PlayerTurn == 1)
						{
							GameGridBR.Content = "X";
						}
					}
				}
				else if (result[0] == "t")
				{
					PlayerTurn = int.Parse(result[1]);

					if (PlayerIndex == PlayerTurn)
					{
						MessageBox.Show("Your turn!");
					}
					else
					{
						MessageBox.Show("Player " + (result[1] + 1) + "'s turn... Waiting for your turn.");
					}
				}
				else if (result[0] == "w")
				{
					if (result[1] == PlayerIndex.ToString())
					{
						MessageBox.Show("You won!!!");
					}
					else
					{
						MessageBox.Show("Player " + result[1] + " wins, better luck next time.");
					}
				}
			}
		}

		private void GameGridTL_Click(object sender, RoutedEventArgs e)
		{
			SocketSend("m:0:0");
		}

		private void GameGridTC_Click(object sender, RoutedEventArgs e)
		{
			SocketSend("m:0:1");
		}

		private void GameGridTR_Click(object sender, RoutedEventArgs e)
		{
			SocketSend("m:0:2");
		}

		private void GameGridCL_Click(object sender, RoutedEventArgs e)
		{
			SocketSend("m:1:0");
		}

		private void GameGridCC_Click(object sender, RoutedEventArgs e)
		{
			SocketSend("m:1:1");
		}

		private void GameGridCR_Click(object sender, RoutedEventArgs e)
		{
			SocketSend("m:1:2");
		}

		private void GameGridBL_Click(object sender, RoutedEventArgs e)
		{
			SocketSend("m:2:0");
		}

		private void GameGridBC_Click(object sender, RoutedEventArgs e)
		{
			SocketSend("m:2:1");
		}

		private void GameGridBR_Click(object sender, RoutedEventArgs e)
		{
			SocketSend("m:2:2");
		}
	}
}