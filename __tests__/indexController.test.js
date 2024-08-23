import { findUserById } from "../controllers/indexController.mjs";

const mockRequest = {
  params: {
    id: 2,
  },
};

const mockResponse = {
  sendStatus: jest.fn(),
  json: jest.fn(),
};

describe("find user by id", () => {
  // beforeEach(() => {
  //   jest.clearAllMocks();
  // });

  it("should return user by id", async () => {
    findUserById(mockRequest, mockResponse);
    expect(mockResponse.json).toHaveBeenCalled();
    expect(mockResponse.json).toHaveBeenCalledWith({
      id: 3,
      username: "user3",
      name: "Jim Brown",
      email: "jimbrown3@example.com",
    });
    expect(mockResponse.json).toHaveBeenCalledTimes(1);
  });

  it("should call sendStatus with 404 when user not found", async () => {
    const copymockRequest = { ...mockRequest, params: { id: 100 } };
    findUserById(copymockRequest, mockResponse);
    expect(mockResponse.sendStatus).toHaveBeenCalled();
    expect(mockResponse.sendStatus).toHaveBeenCalledWith(404);
    expect(mockResponse.sendStatus).toHaveBeenCalledTimes(1);
    expect(mockResponse.json).not.toHaveBeenCalled();
  });
});
