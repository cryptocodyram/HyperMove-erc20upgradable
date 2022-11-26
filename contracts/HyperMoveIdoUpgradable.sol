/// SPDX-License-Identifier: MIT

pragma solidity =0.8.10;

import "./IERC20.sol";

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "hardhat/console.sol";

/**
 * @title The HyperMovePresaleUpgradeable
 * @dev The contract is upgradeable through EIP1967 pattern
 * @author HyperMove
 * @notice Performs HyperMove presale & claim
 */
contract HyperMovePresaleUpgradeable is Initializable, OwnableUpgradeable {
    // /// @dev Receive BUSD
    // receive() external payable {}

    /// @dev The presale info
    struct PreSaleInfo {
        // The minimum hyperMove allocation
        uint256 minAllocation;
        // The maximum hyperMove allocation
        uint256 maxAllocation;
        // The purchase cap
        uint256 purchaseCap;
    }

    /// @notice The presale info
    PreSaleInfo public preSaleInfo;

    /// @notice the admin wallet
    address public adminWallet;

    /// @notice The contract instance of BUSD token
    IERC20 public bUSD;

    /// @notice The contract instance of HyperMove token
    IERC20 public hyperMove;

    /// @notice The price numerator of hyper move
    uint256 public constant PRICE_NUMERATOR = 1000000;

    /// @notice The price of hyper move token
    uint256 public hyperMovePrice;

    /// @notice The raised amount BUSD
    uint256 public raisedBUSD;

    /// @notice The number of total users participated
    uint256 public totalUsersParticipated;

    /// @notice The identifier for public sale
    bool public isPublicSale;

    /// @notice The identifier to check if sale ends
    bool public isSaleEnd;

    /// @notice The list of hyper move user allocation
    mapping(address => uint256) public hyperMoveUserAllocation;

    /// @notice The list of user purchases
    mapping(address => uint256) public userPurchases;

    event Claim(address recieverAddress, uint256 amount);

    /**
     * @notice Initliazation of HyperMovePresaleUpgradeable
     * @param _busd The contract address of BUSD token
     * @param _hyperMove The contract address of HyperMove token
     * @param _hyperMovePrice The price per BUSD of HyperMove
     * @param _minAllocation The minimum amount of user allocation
     * @param _maxAllocation The maximum amount of user allocation
     * @param _purchaseCap The purchase cap
     * @param _adminWallet admin wallet
     */
    function __HyperMovePresaleUpgradeable_init(
        address _busd,
        address _hyperMove,
        uint256 _hyperMovePrice,
        uint256 _minAllocation,
        uint256 _maxAllocation,
        uint256 _purchaseCap,
        address _adminWallet
    ) external initializer {
        __Ownable_init();
        __HyperMovePresaleUpgradeable_init_unchained(
            _busd,
            _hyperMove,
            _hyperMovePrice,
            _minAllocation,
            _maxAllocation,
            _purchaseCap,
            _adminWallet
        );
    }

    /**
     * @notice Sets initial state of HyperMove presale contract
     * @param _busd The contract address of BUSD token
     * @param _hyperMove The contract address of HyperMove token
     * @param _hyperMovePrice The price per BUSD of HyperMove
     * @param _minAllocation The minimum amount of user allocation
     * @param _maxAllocation The maximum amount of user allocation
     * @param _purchaseCap The purchase cap
     * @param _adminWallet The purchase cap
     */
    function __HyperMovePresaleUpgradeable_init_unchained(
        address _busd,
        address _hyperMove,
        uint256 _hyperMovePrice,
        uint256 _minAllocation,
        uint256 _maxAllocation,
        uint256 _purchaseCap,
        address _adminWallet
    ) internal initializer {
        require(
            _hyperMove != address(0) && _busd != address(0) && _adminWallet != address(0) &&
                _minAllocation > 0 &&
                _maxAllocation > _minAllocation &&
                _purchaseCap > _maxAllocation,
            "Invalid Args"
        );

        bUSD = IERC20(_busd);
        hyperMove = IERC20(_hyperMove);
        hyperMovePrice = _hyperMovePrice;
        adminWallet = _adminWallet;

        // set presale details
        preSaleInfo = PreSaleInfo({
            minAllocation: _minAllocation,
            maxAllocation: _maxAllocation,
            purchaseCap: _purchaseCap
        });
    }

    /**
     * @notice Switch sale flag of HyperMove
     * @dev Call by current owner of HyperMove presale
     * @param saleFlag The status of sale flag
     */
    function switchSalePhase(bool saleFlag) external onlyOwner {
        isPublicSale = saleFlag;
    }

    /**
     * @notice Sets HyperMove users private sale allocations
     * @dev Call by current owner of HyperMove presale
     * @param users The list of private sale users
     * @param tokens The list of user HyperMove allocations
     */
    function setHyperMoveUsersAllocation(
        address[] memory users,
        uint256[] memory tokens
    ) external onlyOwner {
        uint8 usersCount = uint8(users.length);
        require(usersCount > 0 && usersCount == tokens.length);
        for (uint8 j = 0; j < usersCount; j++) {
            require(users[j] != address(0) && tokens[j] > 0, "Mismatch Args");
            hyperMoveUserAllocation[users[j]] = tokens[j];
        }
    }

    /**
     * @notice Update hyper move price
     * @dev Call by current owner of HyperMove presale
     * @param _hyperMovePrice The price of hyper move token
     */
    function updateHyperMovePrice(uint256 _hyperMovePrice) external onlyOwner {
        hyperMovePrice = _hyperMovePrice;
    }

    /**
     * @notice Update Hyper Move token contract instance
     * @dev Call by current owner of HyperMove presale
     * @param _hyperMove The contract address of HyperMove token
     */
    function updateHyperMove(address _hyperMove) external onlyOwner {
        hyperMove = IERC20(_hyperMove);
    }

    /**
     * @notice Update presale info
     * @dev Call by current owner of HyperMove presale
     * @param minAllocation The amount of minimum allocation
     * @param maxAllocation The amount of maximum allocation
     * @param purchaseCap The purchase cap
     */
    function updatePreSaleInfo(
        uint256 minAllocation,
        uint256 maxAllocation,
        uint256 purchaseCap
    ) external onlyOwner {
        require(
            minAllocation > 0 &&
                maxAllocation > minAllocation &&
                purchaseCap > maxAllocation,
            "Invalid Sale Info"
        );
        preSaleInfo = PreSaleInfo(minAllocation, maxAllocation, purchaseCap);
    }

    /**
     * @notice Sets sale ends
     * @dev Call by current owner of HyperMove presale
     * @param saleEndFlag The status of sale ends flag
     */
    function setSaleEnds(bool saleEndFlag) external onlyOwner {
        isSaleEnd = saleEndFlag;
    }

    /**
     * @notice buy HyperMove token with BUSD
     * @param amount The amount of bnb to purchase
     */
    function buy(uint256 amount) external {
        // verify the purchase
        _verifyPurchase(amount);

        require(!isSaleEnd, "Sale Ends");

        require(
            preSaleInfo.purchaseCap >= raisedBUSD + amount,
            "Purchase Cap Reached"
        );

        require(bUSD.transferFrom(_msgSender(), adminWallet, amount), "token transfer failed");

        raisedBUSD += amount;

        if (userPurchases[_msgSender()] == 0) {
            totalUsersParticipated++;
        }

        userPurchases[_msgSender()] += amount;
    }

    /**
     * @notice Claim Hyper Move
     * @dev Countered Error when invalid attempt or sale not ends
     */
    function claimHyperMove() external {
        uint256 purchaseAmount = userPurchases[_msgSender()];
        require(purchaseAmount > 0, "Invalid Attempt");
        require(isSaleEnd, "Sale Not Ends Yet");

        // reset to 0
        userPurchases[_msgSender()] = 0;

        uint256 transferableHyperMove = _convertBusdToHyperMove(purchaseAmount);
        hyperMove.transfer(_msgSender(), transferableHyperMove);

        emit Claim(_msgSender(), transferableHyperMove);
    }

    /**
     * @notice Withdraw raised BUSD
     * @dev Throw error when withdraw failed &
     * Call by current owner of HyperMove presale
     * @param withdrawableAddress The account of withdrawable
     * @param value The value to be withdraw
     */
    function withdraw(address withdrawableAddress, uint256 value)
        external
        onlyOwner
    {
        require(
            withdrawableAddress != address(0),
            "Invalid Withdrawable Address"
        );
        require(address(this).balance >= value, "Invalid Value");
        (bool success, ) = withdrawableAddress.call{value: value}("");
        require(success, "Withdraw Failed");
    }

    /**
     * @notice Rescue Any Token
     * @dev Call by current owner of HyperMove presale
     * @param withdrawableAddress The account of withdrawable
     * @param token The instance of ERC20 token
     * @param amount The token amount to withdraw
     */
    function rescueToken(
        address withdrawableAddress,
        IERC20 token,
        uint256 amount
    ) external onlyOwner {
        require(
            withdrawableAddress != address(0),
            "Invalid Withdrawable Address"
        );
        token.transfer(withdrawableAddress, amount);
    }

    /**
     * @notice Verify the purchases
     * @dev Throws error when purchases verification failed
     * @param amount The amount to buy
     */
    function _verifyPurchase(uint256 amount) internal view {
        uint256 maxAllocation = isPublicSale
            ? preSaleInfo.maxAllocation
            : hyperMoveUserAllocation[_msgSender()];
        require(
            amount >= preSaleInfo.minAllocation &&
                amount <= maxAllocation &&
                userPurchases[_msgSender()] + amount <= maxAllocation,
            "Buy Failed"
        );
    }

    /**
     * @notice Convert BUSD to Hyper Move token & Returns converted HyperMove's
     * @param amount The amount of BUSD
     * @return hyperMoves The amount of HyperMove's
     */
    function _convertBusdToHyperMove(uint256 amount)
        internal
        view
        returns (uint256)
    {
        return (amount * hyperMovePrice);
        // return (amount * PRICE_NUMERATOR) / (hyperMovePrice * 1e9);
    }
}