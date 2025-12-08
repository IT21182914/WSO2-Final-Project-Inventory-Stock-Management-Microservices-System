/**
 * User Controller Tests
 */

const UserController = require("../../src/controllers/user.controller");
const User = require("../../src/models/user.model");
const {
  mockRequest,
  mockResponse,
  sampleUser,
} = require("../utils/testHelpers");

jest.mock("../../src/models/user.model");
jest.mock("../../src/config/logger");

describe("UserController", () => {
  let controller;
  let req;
  let res;

  beforeEach(() => {
    controller = new UserController();
    req = mockRequest();
    res = mockResponse();
    jest.clearAllMocks();
  });

  describe("createUser", () => {
    beforeEach(() => {
      req.body = {
        username: "testuser",
        email: "test@example.com",
        password: "Test@1234",
        full_name: "Test User",
        role: "staff",
      };
    });

    it("should create user successfully", async () => {
      User.findByEmail.mockResolvedValue(null);
      User.findByUsername.mockResolvedValue(null);
      User.create.mockResolvedValue(sampleUser);

      await controller.createUser(req, res);

      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          username: "testuser",
          email: "test@example.com",
          full_name: "Test User",
          role: "staff",
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "User created successfully",
        data: sampleUser,
      });
    });

    it("should return 400 if email already exists", async () => {
      User.findByEmail.mockResolvedValue(sampleUser);

      await controller.createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Email already registered",
      });
    });

    it("should return 400 if username already exists", async () => {
      User.findByEmail.mockResolvedValue(null);
      User.findByUsername.mockResolvedValue(sampleUser);

      await controller.createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Username already taken",
      });
    });
  });

  describe("getAllUsers", () => {
    it("should get all users successfully", async () => {
      const users = [sampleUser, { ...sampleUser, id: 2 }];
      User.findAll.mockResolvedValue(users);

      await controller.getAllUsers(req, res);

      expect(User.findAll).toHaveBeenCalledWith({});
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 2,
        data: users,
      });
    });

    it("should filter by role", async () => {
      req.query = { role: "staff" };
      User.findAll.mockResolvedValue([sampleUser]);

      await controller.getAllUsers(req, res);

      expect(User.findAll).toHaveBeenCalledWith({ role: "staff" });
    });

    it("should filter by is_active", async () => {
      req.query = { is_active: "true" };
      User.findAll.mockResolvedValue([sampleUser]);

      await controller.getAllUsers(req, res);

      expect(User.findAll).toHaveBeenCalledWith({ is_active: true });
    });
  });

  describe("getUserById", () => {
    beforeEach(() => {
      req.params = { id: "1" };
    });

    it("should get user by ID successfully", async () => {
      User.findById.mockResolvedValue(sampleUser);

      await controller.getUserById(req, res);

      expect(User.findById).toHaveBeenCalledWith("1");
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: sampleUser,
      });
    });

    it("should return 404 if user not found", async () => {
      User.findById.mockResolvedValue(null);

      await controller.getUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "User not found",
      });
    });
  });

  describe("updateUser", () => {
    beforeEach(() => {
      req.params = { id: "1" };
      req.body = {
        full_name: "Updated User",
        email: "updated@example.com",
      };
    });

    it("should update user successfully", async () => {
      const updatedUser = { ...sampleUser, ...req.body };
      User.findById.mockResolvedValue(sampleUser);
      User.update.mockResolvedValue(updatedUser);

      await controller.updateUser(req, res);

      expect(User.update).toHaveBeenCalledWith("1", req.body);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "User updated successfully",
        data: updatedUser,
      });
    });

    it("should return 404 if user not found", async () => {
      User.findById.mockResolvedValue(null);

      await controller.updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("deleteUser", () => {
    beforeEach(() => {
      req.params = { id: "1" };
    });

    it("should soft delete user successfully", async () => {
      User.findById.mockResolvedValue(sampleUser);
      User.softDelete.mockResolvedValue({ ...sampleUser, is_active: false });

      await controller.deleteUser(req, res);

      expect(User.softDelete).toHaveBeenCalledWith("1");
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "User deleted successfully",
      });
    });

    it("should return 404 if user not found", async () => {
      User.findById.mockResolvedValue(null);

      await controller.deleteUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
